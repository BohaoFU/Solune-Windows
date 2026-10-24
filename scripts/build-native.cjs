'use strict';
const fs=require('node:fs'),path=require('node:path'),{execFileSync}=require('node:child_process');
const root=path.resolve(__dirname,'..'),framework=path.join(process.env.WINDIR||'C:\\Windows','Microsoft.NET/Framework64/v4.0.30319');
fs.mkdirSync(path.join(root,'native/bin'),{recursive:true});
const refs=['System.Windows.Forms.dll','System.Drawing.dll',...['UIAutomationClient','UIAutomationTypes','WindowsBase'].map(n=>path.join(framework,'WPF',n+'.dll'))];
execFileSync(path.join(framework,'csc.exe'),['/nologo','/target:exe','/platform:x64','/optimize+','/out:'+path.join(root,'native/bin/ClockBridge.exe'),...refs.map(r=>'/reference:'+r),path.join(root,'native/ClockBridge.cs')],{stdio:'inherit'});
execFileSync(path.join(root,'native/bin/ClockBridge.exe'),['--selftest'],{stdio:'inherit'});
if(!fs.existsSync(path.join(root,'assets/icon.ico')))throw Error('Missing plum icon. Run npm run build:icons first.');
console.log('Native clock bridge built; using bundled plum blossom icons.');
