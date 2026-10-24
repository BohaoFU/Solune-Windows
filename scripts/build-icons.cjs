'use strict';
// Run with Electron: node_modules/electron/cli.js scripts/build-icons.cjs
const {app,BrowserWindow}=require('electron'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..');
app.setPath('userData',path.join(root,'.cache/icon-profile'));
app.disableHardwareAcceleration();
app.whenReady().then(async()=>{
 const window=new BrowserWindow({width:512,height:512,show:false,transparent:true,frame:false,webPreferences:{sandbox:true,contextIsolation:true,nodeIntegration:false,offscreen:true,backgroundThrottling:false}});
 await window.loadURL('data:text/html;charset=utf-8,'+encodeURIComponent('<html><style>html,body{margin:0;background:transparent;width:512px;height:512px}svg{width:512px;height:512px}</style>'+fs.readFileSync(path.join(root,'assets/plum.svg'),'utf8')+'</html>'));
 await window.webContents.executeJavaScript('new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)))');
 const image=await window.webContents.capturePage(undefined,{stayHidden:true,stayAwake:true}),sizes=[16,24,32,48,64,128,256],pngs=sizes.map(size=>image.resize({width:size,height:size,quality:'best'}).toPNG());
 const header=Buffer.alloc(6+16*sizes.length);header.writeUInt16LE(1,2);header.writeUInt16LE(sizes.length,4);let offset=header.length;
 sizes.forEach((size,i)=>{const at=6+i*16;header[at]=size===256?0:size;header[at+1]=header[at];header.writeUInt16LE(1,at+4);header.writeUInt16LE(32,at+6);header.writeUInt32LE(pngs[i].length,at+8);header.writeUInt32LE(offset,at+12);offset+=pngs[i].length;});
 fs.writeFileSync(path.join(root,'assets/icon.ico'),Buffer.concat([header,...pngs]));
 for(const [name,size]of [['assets/icon-256.png',256],['renderer/icon-512.png',512],['renderer/icon-192.png',192]])fs.writeFileSync(path.join(root,name),image.resize({width:size,height:size,quality:'best'}).toPNG());
 fs.copyFileSync(path.join(root,'assets/plum.svg'),path.join(root,'renderer/icon.svg'));
 window.destroy();console.log('Plum blossom ICO (16–256px) and PNG assets built.');app.quit();
}).catch(e=>{console.error(e);app.exit(1);});
