'use strict';
function loginCommand(app,portableExe){
 return {path:portableExe||app.getPath('exe'),args:app.isPackaged?['--background']:[app.getAppPath(),'--background']};
}
function setStartup(app,preferences,command,value,testing=false){
 if(!testing){
  app.setLoginItemSettings({...command,openAtLogin:value});
  if(app.getLoginItemSettings(command).openAtLogin!==value)throw Error('Windows 未保存开机启动设置');
 }
 preferences.startup=value;
}
function initializeStartup(app,preferences,command,testing=false){
 // Only the packaged app registers itself; tests and development never change login settings.
 if(testing||!app.isPackaged||typeof preferences.startup==='boolean')return false;
 setStartup(app,preferences,command,true);return true;
}
module.exports={loginCommand,setStartup,initializeStartup};
