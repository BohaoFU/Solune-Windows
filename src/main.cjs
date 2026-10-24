'use strict';
const {app,BrowserWindow,Menu,Tray,nativeImage,ipcMain,screen,globalShortcut,session,dialog,shell}=require('electron');
const fs=require('node:fs'),path=require('node:path'),{pathToFileURL}=require('node:url'),{spawn}=require('node:child_process'),readline=require('node:readline');
const {panelBounds}=require('./panel-position.cjs');
const root=path.resolve(__dirname,'..'),html=path.join(root,'renderer/index.html'),pageUrl=pathToFileURL(html).href;
const clockTesting=process.argv.includes('--clock-test');
const testing=process.argv.includes('--smoke-test')||clockTesting;
if(testing)app.setPath('userData',path.resolve(process.env.SOLUNE_TEST_DATA||path.join(root,'.test-data')));
let main,panel,tray,bridge,quitting=false,status='正在识别系统时钟…',settingsPath,lastToggle=0;
let preferences={replaceClock:true};
function startupCommand(){return {path:process.env.PORTABLE_EXECUTABLE_FILE||app.getPath('exe'),args:['--background']};}
function getSettings(){return {...preferences,startup:app.getLoginItemSettings(startupCommand()).openAtLogin,status,shortcut:'Ctrl+Alt+D'};}
function rebuildMenu(){if(!tray)return;tray.setContextMenu(Menu.buildFromTemplate([
 {label:'打开岁时万年历',click:()=>showMain()},
 {label:'农历小面板 · Ctrl+Alt+D',click:()=>togglePanel(null,true)},
 {type:'separator'},{label:status,enabled:false},
 {label:'接管系统时间的左键点击',type:'checkbox',checked:preferences.replaceClock,click:item=>changeSetting('replaceClock',item.checked)},
 {label:'开机启动',type:'checkbox',checked:app.getLoginItemSettings(startupCommand()).openAtLogin,click:item=>changeSetting('startup',item.checked)},
 {type:'separator'},{label:'退出（恢复系统日历点击）',click:()=>{quitting=true;app.quit();}}
]));}
function updateStatus(value){status=value;for(const w of [main,panel])if(w&&!w.isDestroyed())w.webContents.send('desktop:status',status);rebuildMenu();}
function secureWindow(w){
 w.webContents.on('will-navigate',(e,url)=>{if(url.split(/[?#]/,1)[0]!==pageUrl)e.preventDefault();});
 w.webContents.setWindowOpenHandler(({url})=>{
  if(['https://github.com/6tail/lunar-javascript','https://github.com/BohaoFU/Solune-Windows'].includes(url))shell.openExternal(url);
  else if(url===pathToFileURL(path.join(root,'renderer/vendor/LICENSE-lunar.txt')).href)dialog.showMessageBox(w,{title:'lunar-javascript · MIT',message:fs.readFileSync(path.join(root,'renderer/vendor/LICENSE-lunar.txt'),'utf8')});
  return {action:'deny'};
 });
}
function createWindow(isPanel=false){
 const w=new BrowserWindow({width:isPanel?460:1280,height:isPanel?680:900,minWidth:isPanel?280:820,minHeight:isPanel?300:600,show:false,title:'岁时万年历 · Solune',icon:path.join(root,'assets/icon.ico'),frame:!isPanel,resizable:!isPanel,skipTaskbar:isPanel,alwaysOnTop:isPanel,backgroundColor:'#f7f7f2',autoHideMenuBar:true,webPreferences:{preload:path.join(__dirname,'preload.cjs'),nodeIntegration:false,contextIsolation:true,sandbox:true,webSecurity:true}});
 secureWindow(w);w.loadFile(html,{query:isPanel?{panel:'1'}:{}});
 if(isPanel)w.on('blur',()=>w.hide());else w.on('close',e=>{if(!quitting){e.preventDefault();w.hide();}});
 return w;
}
function showMain(date){
 if(!main||main.isDestroyed())main=createWindow();if(main.isMinimized())main.restore();
 if(date){if(main.webContents.isLoading())main.webContents.once('did-finish-load',()=>main.webContents.send('desktop:date',date));else main.webContents.send('desktop:date',date);}
 panel?.hide();main.show();main.focus();
}
function togglePanel(anchor,force=false){
 if(Date.now()-lastToggle<250)return;lastToggle=Date.now();
 if(!force&&panel.isVisible()){panel.hide();return;}
 const point=anchor||tray.getBounds(),display=screen.getDisplayNearestPoint({x:Math.round(point.x),y:Math.round(point.y)});
 panel.setBounds(panelBounds(point,display.workArea));panel.show();panel.focus();panel.webContents.send('desktop:panel');
}
function stopBridge(){if(bridge){const child=bridge;bridge=null;child.kill();}}
function startBridge(){
 stopBridge();if(!preferences.replaceClock){updateStatus('系统时钟保持原样');return;}
 if(process.platform!=='win32'){updateStatus('时钟接管仅支持 Windows');return;}
 const file=app.isPackaged?path.join(process.resourcesPath,'native/ClockBridge.exe'):path.join(root,'native/bin/ClockBridge.exe');
 if(!fs.existsSync(file)){updateStatus('时钟接管组件缺失，可使用托盘面板');return;}
 updateStatus('正在识别系统时钟…');bridge=spawn(file,['--parent',String(process.pid)],{windowsHide:true,stdio:['ignore','pipe','pipe']});const child=bridge;
 readline.createInterface({input:child.stdout}).on('line',line=>{try{const e=JSON.parse(line);
  if(e.type==='status')updateStatus(e.count>0?'已接管系统时钟 · 点击查看农历':'未识别系统时钟，可使用托盘或 Ctrl+Alt+D');
  if(e.type==='clock-click'&&Number.isFinite(e.x)&&Number.isFinite(e.y)){const p=screen.screenToDipPoint({x:e.x,y:e.y});togglePanel({...p,width:0,height:0});}
 }catch{}});
 child.on('error',()=>updateStatus('时钟接管启动失败，可使用托盘面板'));
 child.on('exit',()=>{if(bridge===child){bridge=null;updateStatus('时钟接管已停止，可使用托盘面板');}});
}
function changeSetting(key,value){
 if(typeof value!=='boolean'||!['replaceClock','startup'].includes(key))throw Error('设置无效');
 if(key==='startup'){
  if(!testing)app.setLoginItemSettings({...startupCommand(),openAtLogin:value});
 }else{
  preferences.replaceClock=value;fs.mkdirSync(path.dirname(settingsPath),{recursive:true});fs.writeFileSync(settingsPath+'.tmp',JSON.stringify(preferences));fs.renameSync(settingsPath+'.tmp',settingsPath);if(!testing||clockTesting)startBridge();
 }
 rebuildMenu();return getSettings();
}
function validateNotes(notes){
 if(!Array.isArray(notes)||notes.length>10000)throw Error('记事文件格式不正确');
 return notes.map(n=>{const d=n?.date;if(!n||typeof n.id!=='string'||!n.id||n.id.length>200||typeof d!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(d)||d<'1901-01-01'||d>'2100-12-31'||new Date(d+'T00:00:00Z').toISOString().slice(0,10)!==d||typeof n.title!=='string'||n.title.length>50||typeof n.body!=='string'||n.body.length>500)throw Error('记事内容或日期无效');return {id:n.id,date:d,title:n.title,body:n.body};});
}
function handlers(){
 const handle=(name,fn)=>ipcMain.handle(name,(e,...args)=>{if(![main,panel].some(w=>w&&e.sender===w.webContents)||e.senderFrame!==e.sender.mainFrame)throw Error('无效窗口');return fn(e,...args);});
 handle('desktop:settings',()=>getSettings());handle('desktop:setting',(_e,k,v)=>changeSetting(k,v));
 handle('desktop:main',(_e,d)=>{if(d&&!/^\d{4}-\d{2}-\d{2}$/.test(d))throw Error('日期无效');showMain(d);});
 handle('desktop:hide-panel',()=>panel.hide());
 handle('desktop:backup',async(e,notes)=>{const data=validateNotes(notes),r=await dialog.showSaveDialog(BrowserWindow.fromWebContents(e.sender),{title:'备份我的记事',defaultPath:'Solune-notes.json',filters:[{name:'JSON',extensions:['json']}]});if(r.canceled)return false;await fs.promises.writeFile(r.filePath,JSON.stringify({format:'solune-notes',version:1,notes:data},null,2));return true;});
 handle('desktop:restore',async e=>{const r=await dialog.showOpenDialog(BrowserWindow.fromWebContents(e.sender),{title:'导入记事备份（合并）',properties:['openFile'],filters:[{name:'JSON',extensions:['json']}]});if(r.canceled)return null;const stat=await fs.promises.stat(r.filePaths[0]);if(stat.size>10*1024*1024)throw Error('备份文件过大');const p=JSON.parse(await fs.promises.readFile(r.filePaths[0],'utf8'));return validateNotes(Array.isArray(p)?p:p.notes);});
}
if(!app.requestSingleInstanceLock())app.quit();else{
 app.on('second-instance',(_e,args)=>args.includes('--panel')?togglePanel(null,true):showMain());
 app.whenReady().then(()=>{
  app.setAppUserModelId('cn.suishi.calendar.windows');settingsPath=path.join(app.getPath('userData'),'desktop-settings.json');try{const p=JSON.parse(fs.readFileSync(settingsPath,'utf8'));if(typeof p.replaceClock==='boolean')preferences.replaceClock=p.replaceClock;}catch{}
  session.defaultSession.setPermissionRequestHandler((_w,_p,cb)=>cb(false));
  session.defaultSession.webRequest.onBeforeRequest((d,cb)=>cb({cancel:!['file:','data:','devtools:'].some(p=>d.url.startsWith(p))}));
  Menu.setApplicationMenu(null);main=createWindow();panel=createWindow(true);tray=new Tray(nativeImage.createFromPath(path.join(root,'assets/icon.ico')));tray.setToolTip('岁时万年历 · 点击查看农历');tray.on('click',()=>togglePanel());handlers();rebuildMenu();
  if(testing&&!clockTesting)updateStatus('测试模式 · 未接管系统时钟');else startBridge();
  globalShortcut.register('CommandOrControl+Alt+D',()=>togglePanel());
  main.once('ready-to-show',()=>{if(!process.argv.includes('--background'))showMain();});
 }).catch(e=>{console.error(e);app.exit(1);});
 app.on('activate',()=>showMain());app.on('window-all-closed',()=>{});
 app.on('before-quit',()=>{quitting=true;stopBridge();globalShortcut.unregisterAll();tray?.destroy();});
}
