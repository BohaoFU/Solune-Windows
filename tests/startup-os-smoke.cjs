'use strict';
// Uses a unique temporary current-user login item, and removes it before exiting.
const {app}=require('electron'),assert=require('node:assert/strict'),path=require('node:path');
app.setPath('userData',path.resolve(__dirname,'../.test-data-startup'));
const {setStartup}=require('../src/startup.cjs');
app.setName('Solune Startup Smoke '+process.pid);
app.whenReady().then(()=>{
 const command={path:process.execPath,args:[__filename,'--temporary-login-item']},preferences={};
 try{
  assert.equal(app.getLoginItemSettings(command).openAtLogin,false);
  setStartup(app,preferences,command,true);assert.equal(app.getLoginItemSettings(command).openAtLogin,true);
  setStartup(app,preferences,command,false);assert.equal(app.getLoginItemSettings(command).openAtLogin,false);
  console.log('PASS: Windows saved and removed a temporary current-user startup entry.');
 }finally{app.setLoginItemSettings({...command,openAtLogin:false});}
 app.quit();
}).catch(e=>{console.error(e);app.exit(1);});
