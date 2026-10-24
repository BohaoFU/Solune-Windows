'use strict';
(async()=>{
 const bridge=window.soluneDesktop;if(!bridge)return;
 const flyout=new URLSearchParams(location.search).has('panel');
 document.body.classList.toggle('flyout',flyout);
 const bar=document.createElement('div');bar.className='desktop-flyout-bar';bar.innerHTML='<span><b>岁时</b><small>农历与日常</small></span><div><button id="open-full-app">打开 App ↗</button><button id="hide-flyout" aria-label="收起日历">×</button></div>';document.body.prepend(bar);
 $('#open-full-app').onclick=()=>bridge.openMain(selected);$('#hide-flyout').onclick=()=>bridge.hidePanel();
 const settingsButton=document.createElement('button');settingsButton.className='nav-item';settingsButton.id='desktop-settings-button';settingsButton.innerHTML=icon('help')+'<span>桌面设置</span>';$('.sidebar nav').append(settingsButton);
 const settingsDialog=document.createElement('dialog');settingsDialog.id='desktop-settings';settingsDialog.innerHTML='<div class="dialog-title"><h2>桌面设置</h2><button class="icon-button" id="close-desktop-settings" aria-label="关闭设置">×</button></div><div class="desktop-setting"><label><input id="replace-clock" type="checkbox"> 点击系统时间，打开岁时农历</label><p id="clock-bridge-status" role="status"></p><p>退出岁时后，系统日历点击自动恢复。系统通知中心仍可通过 Win+N 打开。</p></div><div class="desktop-setting"><label><input id="startup-app" type="checkbox"> 登录 Windows 时启动</label><p>启动后驻留托盘，不弹出主窗口。</p></div><div class="desktop-setting"><b>快捷打开</b><p>点击托盘图标，或按 Ctrl+Alt+D。</p></div><div class="desktop-setting"><b>我的记事</b><p>保存在本机 App 数据目录。导入时合并，保留本机已有的同 ID 记事。</p><div class="desktop-backup-actions"><button id="backup-notes" class="primary-button">导出备份</button><button id="restore-notes" class="today-button">导入备份</button></div></div>';document.body.append(settingsDialog);
 $('#close-desktop-settings').onclick=()=>settingsDialog.close();
 async function fillSettings(){const s=await bridge.getSettings();$('#replace-clock').checked=s.replaceClock;$('#startup-app').checked=s.startup;$('#clock-bridge-status').textContent=s.status;}
 settingsButton.onclick=async()=>{await fillSettings();settingsDialog.showModal();};
 const footerButton=$('#install-btn');footerButton.id='desktop-settings-open';footerButton.textContent='桌面设置';footerButton.addEventListener('click',()=>settingsButton.click());
 for(const [id,key]of [['replace-clock','replaceClock'],['startup-app','startup']])$("#"+id).onchange=async e=>{e.target.disabled=true;try{await bridge.updateSetting(key,e.target.checked);await fillSettings();}catch(err){toast('设置未保存：'+err.message);await fillSettings();}finally{e.target.disabled=false;}};
 $('#backup-notes').onclick=async()=>{try{if(await bridge.backupNotes(notes))toast('记事备份已保存');}catch(err){toast('备份失败：'+err.message);}};
 $('#restore-notes').onclick=async()=>{try{const imported=await bridge.restoreNotes();if(!imported)return;const existing=new Map(notes.map(n=>[n.id,n]));let count=0;for(const n of imported)if(!existing.has(n.id)){existing.set(n.id,n);count++;}if(saveNotes([...existing.values()])){if(currentView==='notes')renderNotes();else if(currentView==='calendar')renderCalendar();toast('已导入 '+count+' 条记事');}}catch(err){toast('导入失败：'+err.message);}};
 bridge.onStatus(s=>{$('#clock-bridge-status').textContent=s;});
 bridge.onDate(d=>selectDate(d,true));
 bridge.onPanel(()=>{selectDate(clampDate(chinaToday()),true);});
 document.addEventListener('keydown',e=>{if(e.key==='Escape'&&flyout&&!$('dialog[open]'))bridge.hidePanel();});
 window.addEventListener('storage',e=>{
  if(e.key==='suishi-notes'){try{const saved=JSON.parse(e.newValue||'[]');if(Array.isArray(saved)){notes=saved.filter(n=>n&&typeof n.id==='string'&&isValidDate(n.date)&&typeof n.title==='string'&&n.title.length<=50&&typeof n.body==='string'&&n.body.length<=500);updateNoteCount();if(currentView==='notes')renderNotes();else if(currentView==='calendar')renderCalendar();}}catch{}}
  if(e.key==='suishi-theme'){document.body.classList.toggle('dark',e.newValue==='dark');$('#theme-btn').innerHTML=icon(e.newValue==='dark'?'sun':'moon');}
 });
 await fillSettings();
})();
