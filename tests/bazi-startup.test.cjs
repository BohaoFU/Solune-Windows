'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {calculate,normalizeOptions}=require('../renderer/bazi.js');
const {loginCommand,setStartup,initializeStartup}=require('../src/startup.cjs');
test('published four-pillar example includes ten gods, hidden stems and NaYin',()=>{
 const b=calculate('2005-12-23',{time:'08:37:00'});
 assert.deepEqual(b.pillars.map(p=>p.ganzhi),['乙酉','戊子','辛巳','壬辰']);
 assert.deepEqual(b.pillars.map(p=>p.nayin),['泉中水','霹雳火','白蜡金','长流水']);
 assert.equal(b.dayMaster,'辛金');assert.equal(b.pillars[2].hidden,'丙 · 庚 · 戊');
 assert.equal(b.pillars[2].stemGod,'日主');assert.match(b.dateLine,/乙酉年.*戊子月.*辛巳日/);
});
test('year and month pillars change at the exact LiChun instant, before lunar new year',()=>{
 const {Solar}=require('../renderer/vendor/lunar.js');
 const t=Solar.fromYmd(2026,2,4).getLunar().getJieQiTable()['立春'];
 const near=offset=>new Date(new Date(t.toYmdHms().replace(' ','T')+'Z').getTime()+offset*1000).toISOString().slice(0,19).split('T');
 const before=near(-1),after=near(1);
 const a=calculate(before[0],{time:before[1]}),b=calculate(after[0],{time:after[1]});
 assert.deepEqual(a.pillars.slice(0,2).map(p=>p.ganzhi),['乙巳','己丑']);
 assert.deepEqual(b.pillars.slice(0,2).map(p=>p.ganzhi),['丙午','庚寅']);
 assert.match(b.lunarLine,/乙巳年/);
});
test('late Zi day-boundary preference changes day but preserves the hour pillar',()=>{
 const early=calculate('2026-10-24',{time:'22:59:59'}),midnight=calculate('2026-10-24',{time:'23:00:00',sect:2}),late=calculate('2026-10-24',{time:'23:00:00',sect:1}),next=calculate('2026-10-25',{time:'00:00:00',sect:2});
 assert.equal(early.pillars[2].ganzhi,midnight.pillars[2].ganzhi);
 assert.equal(late.pillars[2].ganzhi,next.pillars[2].ganzhi);
 assert.notEqual(midnight.pillars[2].ganzhi,late.pillars[2].ganzhi);
 assert.equal(midnight.pillars[3].ganzhi,late.pillars[3].ganzhi);
 for(const d of ['1901-01-01','2100-12-31'])assert.equal(calculate(d).pillars.length,4);
 assert.throws(()=>calculate('2026-02-30'));
 assert.equal(normalizeOptions({time:'25:00',sect:99}).time,'12:00:00');
});
test('packaged startup registers once, uses the portable launcher, and respects a saved opt-out',()=>{
 const writes=[],app={isPackaged:true,getPath:()=>'C:/Apps/Solune.exe',getAppPath:()=>'C:/Source',setLoginItemSettings:s=>writes.push(s),getLoginItemSettings:()=>({openAtLogin:writes.at(-1)?.openAtLogin||false})};
 const command=loginCommand(app,'D:/日历 App/Solune-Portable.exe'),prefs={};
 assert.equal(initializeStartup(app,prefs,command),true);
 assert.deepEqual(writes[0],{path:'D:/日历 App/Solune-Portable.exe',args:['--background'],openAtLogin:true});
 assert.equal(initializeStartup(app,prefs,command),false);
 setStartup(app,prefs,command,false);assert.equal(prefs.startup,false);
 assert.equal(initializeStartup(app,prefs,command),false);assert.equal(writes.length,2);
 const isolated={};initializeStartup(app,isolated,command,true);setStartup(app,isolated,command,true,true);assert.equal(writes.length,2);
 app.isPackaged=false;assert.equal(initializeStartup(app,{},command),false);
 assert.deepEqual(loginCommand(app).args,['C:/Source','--background']);
});
