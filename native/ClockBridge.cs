using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Runtime.InteropServices;
using System.Text;
using System.Text.RegularExpressions;
using System.Threading;
using System.Windows;
using System.Windows.Automation;
using System.Windows.Forms;

// A normal-user, out-of-process bridge. Never injects into Explorer or changes the registry.
internal static class ClockBridge {
 [StructLayout(LayoutKind.Sequential)] internal struct Point { public int X,Y; }
 [StructLayout(LayoutKind.Sequential)] internal struct NativeRect { public int Left,Top,Right,Bottom; }
 [StructLayout(LayoutKind.Sequential)] internal struct MouseData { public Point Point; public uint MouseDataValue,Flags,Time; public UIntPtr Extra; }
 internal sealed class Region { public int X,Y,Width,Height; public bool Contains(int x,int y){return x>=X&&y>=Y&&x<X+Width&&y<Y+Height;} }
 private delegate IntPtr HookDelegate(int code,IntPtr message,IntPtr data);
 private delegate bool EnumDelegate(IntPtr window,IntPtr parameter);
 [DllImport("user32.dll")] private static extern bool EnumWindows(EnumDelegate callback,IntPtr parameter);
 [DllImport("user32.dll")] private static extern bool EnumChildWindows(IntPtr parent,EnumDelegate callback,IntPtr parameter);
 [DllImport("user32.dll",CharSet=CharSet.Unicode)] private static extern int GetClassName(IntPtr window,StringBuilder text,int count);
 [DllImport("user32.dll")] private static extern bool GetWindowRect(IntPtr window,out NativeRect rectangle);
 [DllImport("user32.dll")] private static extern bool IsWindowVisible(IntPtr window);
 [DllImport("user32.dll",SetLastError=true)] private static extern IntPtr SetWindowsHookEx(int type,HookDelegate callback,IntPtr module,uint thread);
 [DllImport("user32.dll")] private static extern IntPtr CallNextHookEx(IntPtr hook,int code,IntPtr message,IntPtr data);
 [DllImport("user32.dll")] private static extern bool UnhookWindowsHookEx(IntPtr hook);
 [DllImport("user32.dll")] private static extern bool PostThreadMessage(uint thread,uint message,UIntPtr wParam,IntPtr lParam);
 [DllImport("user32.dll")] private static extern bool SetProcessDpiAwarenessContext(IntPtr context);
 [DllImport("kernel32.dll")] private static extern uint GetCurrentThreadId();
 [DllImport("kernel32.dll",CharSet=CharSet.Unicode)] private static extern IntPtr GetModuleHandle(string module);
 private static volatile Region[] regions=new Region[0];
 private static long observedAt;
 private static bool swallowedDown;
 private static IntPtr hook;
 private static HookDelegate callback=OnMouse;
 private static readonly object outputLock=new object();
 private static string ClassOf(IntPtr h){StringBuilder s=new StringBuilder(256);GetClassName(h,s,s.Capacity);return s.ToString();}
 private static void Emit(string text){lock(outputLock){try{Console.WriteLine(text);Console.Out.Flush();}catch{Environment.Exit(0);}}}
 internal static bool IsClock(string id,string cls,string name,bool button){
  bool exact=id=="ClockButton"||id=="SystemTrayClock"||id=="TrayClock"||cls=="TrayClockWClass"||cls.IndexOf("DateTimeIconContent",StringComparison.OrdinalIgnoreCase)>=0||cls.IndexOf("ClockButton",StringComparison.OrdinalIgnoreCase)>=0;
  bool tray=(id=="SystemTrayIcon"&&cls=="SystemTray.NormalButton");
  bool hasDate=Regex.IsMatch(name,@"\d{1,4}[/\.年-]\d{1,2}")||name.IndexOf("星期",StringComparison.Ordinal)>=0;
  bool named=button&&tray&&(name=="Clock"||name.IndexOf("时钟",StringComparison.Ordinal)>=0||(hasDate&&Regex.IsMatch(name,@"\d{1,2}[:：]\d{2}")));
  return exact||named;
 }
 private static void Add(List<Region> list,Rect r){
  if(r.IsEmpty||r.Width<15||r.Height<10||r.Width>260||r.Height>180||Double.IsInfinity(r.X)||Double.IsNaN(r.X))return;
  Region value=new Region{X=(int)r.X,Y=(int)r.Y,Width=(int)r.Width,Height=(int)r.Height};
  foreach(Region old in list)if(old.X==value.X&&old.Y==value.Y&&old.Width==value.Width&&old.Height==value.Height)return;
  list.Add(value);
 }
 private static Region[] Discover(){
  List<Region> result=new List<Region>();
  EnumWindows(delegate(IntPtr hwnd,IntPtr unused){
   string cls=ClassOf(hwnd);if((cls!="Shell_TrayWnd"&&cls!="Shell_SecondaryTrayWnd")||!IsWindowVisible(hwnd))return true;
   EnumChildWindows(hwnd,delegate(IntPtr child,IntPtr ignored){if(ClassOf(child)=="TrayClockWClass"&&IsWindowVisible(child)){NativeRect r;if(GetWindowRect(child,out r))Add(result,new Rect(r.Left,r.Top,r.Right-r.Left,r.Bottom-r.Top));}return true;},IntPtr.Zero);
   try {
    AutomationElement root=AutomationElement.FromHandle(hwnd);
    AutomationElementCollection elements=root.FindAll(TreeScope.Descendants,Condition.TrueCondition);
    foreach(AutomationElement element in elements){try{
     AutomationElement.AutomationElementInformation p=element.Current;
     if(!p.IsOffscreen&&IsClock(p.AutomationId??"",p.ClassName??"",p.Name??"",p.ControlType==ControlType.Button))Add(result,p.BoundingRectangle);
    }catch(ElementNotAvailableException){}catch(InvalidOperationException){} }
   }catch(Exception){}
   return true;
  },IntPtr.Zero);
  return result.ToArray();
 }
 private static IntPtr OnMouse(int code,IntPtr message,IntPtr data){
  if(code>=0&&(message.ToInt32()==0x201||message.ToInt32()==0x202)){
   MouseData m=(MouseData)Marshal.PtrToStructure(data,typeof(MouseData));
   if(message.ToInt32()==0x202&&swallowedDown){swallowedDown=false;int x=m.Point.X,y=m.Point.Y;ThreadPool.QueueUserWorkItem(delegate{Emit("{\"type\":\"clock-click\",\"x\":"+x+",\"y\":"+y+"}");});return new IntPtr(1);}
   if(message.ToInt32()==0x201&&DateTime.UtcNow.Ticks-Interlocked.Read(ref observedAt)<TimeSpan.FromSeconds(4).Ticks){foreach(Region r in regions)if(r.Contains(m.Point.X,m.Point.Y)){swallowedDown=true;return new IntPtr(1);}}
  }
  return CallNextHookEx(hook,code,message,data);
 }
 [STAThread] private static int Main(string[] args){
  Console.OutputEncoding=new UTF8Encoding(false);
  try{SetProcessDpiAwarenessContext(new IntPtr(-4));}catch{}
  if(Array.IndexOf(args,"--selftest")>=0){
   if(!IsClock("", "SystemTray.DateTimeIconContent", "",false)||!IsClock("SystemTrayIcon", "SystemTray.NormalButton", "19:35 星期五",true)||IsClock("", "Button", "音量",true)||IsClock("", "Taskbar.TaskListButton", "meeting 19:35",true))return 1;
   Region r=new Region{X=-100,Y=30,Width=90,Height=45};if(!r.Contains(-50,40)||r.Contains(-10,40)||r.Contains(-101,40))return 1;
   Emit("{\"type\":\"selftest\",\"passed\":true}");return 0;
  }
  if(Array.IndexOf(args,"--inspect")>=0){Region[] found=Discover();Emit("{\"type\":\"status\",\"count\":"+found.Length+"}");foreach(Region r in found)Emit("{\"x\":"+r.X+",\"y\":"+r.Y+",\"width\":"+r.Width+",\"height\":"+r.Height+"}");return 0;}
  uint mainThread=GetCurrentThreadId();int pi=Array.IndexOf(args,"--parent");int parentId;
  if(pi<0||pi+1>=args.Length||!Int32.TryParse(args[pi+1],out parentId))return 2;
  Process parent;try{parent=Process.GetProcessById(parentId);}catch{return 2;}
  hook=SetWindowsHookEx(14,callback,GetModuleHandle(null),0);if(hook==IntPtr.Zero){Emit("{\"type\":\"error\",\"code\":"+Marshal.GetLastWin32Error()+"}");return 1;}
  Thread watcher=new Thread(delegate(){try{parent.WaitForExit();}catch{}PostThreadMessage(mainThread,0x12,UIntPtr.Zero,IntPtr.Zero);});watcher.IsBackground=true;watcher.Start();
  Thread discovery=new Thread(delegate(){int previous=-1;while(true){try{regions=Discover();Interlocked.Exchange(ref observedAt,DateTime.UtcNow.Ticks);if(previous!=regions.Length){previous=regions.Length;Emit("{\"type\":\"status\",\"count\":"+previous+"}");}}catch{}Thread.Sleep(1500);}});discovery.IsBackground=true;discovery.SetApartmentState(ApartmentState.STA);discovery.Start();
  try{Application.Run();}finally{UnhookWindowsHookEx(hook);}GC.KeepAlive(callback);return 0;
 }
}


