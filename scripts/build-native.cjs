'use strict';
const fs=require('node:fs'),path=require('node:path'),{execFileSync}=require('node:child_process');
const root=path.resolve(__dirname,'..'),framework=path.join(process.env.WINDIR||'C:\\Windows','Microsoft.NET/Framework64/v4.0.30319');
fs.mkdirSync(path.join(root,'native/bin'),{recursive:true});
const refs=['System.Windows.Forms.dll','System.Drawing.dll',...['UIAutomationClient','UIAutomationTypes','WindowsBase'].map(n=>path.join(framework,'WPF',n+'.dll'))];
execFileSync(path.join(framework,'csc.exe'),['/nologo','/target:exe','/platform:x64','/optimize+','/out:'+path.join(root,'native/bin/ClockBridge.exe'),...refs.map(r=>'/reference:'+r),path.join(root,'native/ClockBridge.cs')],{stdio:'inherit'});
execFileSync(path.join(root,'native/bin/ClockBridge.exe'),['--selftest'],{stdio:'inherit'});
// Convert the project's existing icon into a Windows icon; no remote assets.
const iconPng=path.join(root,'assets/icon-256.png');
const ps="$ErrorActionPreference='Stop'; Add-Type -AssemblyName System.Drawing; $image=[Drawing.Image]::FromFile('"+path.join(root,'renderer/icon-512.png').replace(/'/g,"''")+"'); $bitmap=[Drawing.Bitmap]::new(256,256); $g=[Drawing.Graphics]::FromImage($bitmap); $g.InterpolationMode=[Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic; $g.DrawImage($image,0,0,256,256); $bitmap.Save('"+iconPng.replace(/'/g,"''")+"',[Drawing.Imaging.ImageFormat]::Png); $g.Dispose(); $bitmap.Dispose(); $image.Dispose();";
execFileSync(path.join(process.env.WINDIR,'System32/WindowsPowerShell/v1.0/powershell.exe'),['-NoLogo','-NoProfile','-Command',ps],{stdio:'inherit'});
const png=fs.readFileSync(iconPng),header=Buffer.alloc(22);header.writeUInt16LE(1,2);header.writeUInt16LE(1,4);header.writeUInt16LE(1,10);header.writeUInt16LE(32,12);header.writeUInt32LE(png.length,14);header.writeUInt32LE(22,18);fs.writeFileSync(path.join(root,'assets/icon.ico'),Buffer.concat([header,png]));
console.log('Native clock bridge and Windows icon built.');
