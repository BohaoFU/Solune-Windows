'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {panelBounds}=require('../src/panel-position.cjs');
const {Solar,Lunar}=require('../renderer/vendor/lunar.js');
test('known new years and a leap lunar month',()=>{
 for(const [ymd,ly,lm,ld]of [['2026-02-17',2026,1,1],['2025-01-29',2025,1,1],['2024-02-10',2024,1,1],['2023-03-22',2023,-2,1]]){
  const l=Solar.fromYmd(...ymd.split('-').map(Number)).getLunar();assert.deepEqual([l.getYear(),l.getMonth(),l.getDay()],[ly,lm,ld]);assert.equal(Lunar.fromYmd(ly,lm,ld).getSolar().toYmd(),ymd);
 }
});
test('1901–2100 boundaries and month-end dates round trip',()=>{
 for(const ymd of ['1901-01-01','2000-02-29','2026-10-23','2099-12-31','2100-12-31']){const l=Solar.fromYmd(...ymd.split('-').map(Number)).getLunar();assert.equal(Lunar.fromYmd(l.getYear(),l.getMonth(),l.getDay()).getSolar().toYmd(),ymd);}
});
test('lunar dates agree with the runtime independent Chinese calendar',()=>{
 const formatter=new Intl.DateTimeFormat('en-u-ca-chinese',{timeZone:'Asia/Shanghai',year:'numeric',month:'numeric',day:'numeric'});
 for(const ymd of ['2026-02-17','2025-01-29','2023-03-22','2026-10-23']){const l=Solar.fromYmd(...ymd.split('-').map(Number)).getLunar();const parts=formatter.formatToParts(new Date(ymd+'T12:00:00+08:00'));assert.equal(Number(parts.find(p=>p.type==='day').value),l.getDay());assert.equal(Number(parts.find(p=>p.type==='relatedYear').value),l.getYear());}
});
test('panel remains inside work areas with negative monitor coordinates and top taskbars',()=>{
 for(const area of [{x:0,y:0,width:1920,height:1032},{x:-1920,y:0,width:1920,height:1032},{x:0,y:48,width:1366,height:720},{x:0,y:0,width:800,height:480}]){
  for(const anchor of [{x:area.x+area.width-20,y:area.y+area.height,width:20,height:48},{x:area.x+50,y:area.y-48,width:40,height:48}]){
   const r=panelBounds(anchor,area);assert.ok(r.x>=area.x&&r.y>=area.y);assert.ok(r.x+r.width<=area.x+area.width&&r.y+r.height<=area.y+area.height);
  }
 }
});
test('desktop renderer has no remote font import or PWA registration',()=>{
 const fs=require('node:fs'),path=require('node:path');const read=n=>fs.readFileSync(path.join(__dirname,'../renderer',n),'utf8');
 assert.match(read('styles.css'),/^:root/);assert.doesNotMatch(read('styles.css'),/@import|https?:\/\//);assert.doesNotMatch(read('app.js'),/serviceWorker\.register/);assert.match(read('index.html'),/Content-Security-Policy/);assert.match(read('desktop.js'),/footerButton.id='desktop-settings-open'/);
});
