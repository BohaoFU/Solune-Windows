'use strict';
const {contextBridge,ipcRenderer}=require('electron');
contextBridge.exposeInMainWorld('soluneDesktop',Object.freeze({
 getSettings:()=>ipcRenderer.invoke('desktop:settings'),updateSetting:(k,v)=>ipcRenderer.invoke('desktop:setting',k,v),openMain:d=>ipcRenderer.invoke('desktop:main',d),hidePanel:()=>ipcRenderer.invoke('desktop:hide-panel'),backupNotes:n=>ipcRenderer.invoke('desktop:backup',n),restoreNotes:()=>ipcRenderer.invoke('desktop:restore'),
 onPanel:fn=>{ipcRenderer.on('desktop:panel',()=>fn());},onDate:fn=>{ipcRenderer.on('desktop:date',(_e,d)=>fn(d));},onStatus:fn=>{ipcRenderer.on('desktop:status',(_e,s)=>fn(s));}
}));
