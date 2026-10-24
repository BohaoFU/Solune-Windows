/* Four pillars use exact solar-term instants in Beijing time. */
(function(root,factory){
 if(typeof module==='object'&&module.exports)module.exports=factory(require('./vendor/lunar.js').Solar);
 else root.SoluneBaZi=factory(root.Solar);
})(typeof globalThis!=='undefined'?globalThis:this,function(Solar){
 'use strict';
 function normalizeOptions(value={}){
  const time=typeof value.time==='string'&&/^(?:[01]\d|2[0-3]):[0-5]\d(?::[0-5]\d)?$/.test(value.time)?value.time:'12:00:00';
  return {time:time.length===5?time+':00':time,sect:Number(value.sect)===1?1:2,expanded:value.expanded===true};
 }
 function calculate(date,options){
  if(typeof date!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(date)||date<'1901-01-01'||date>'2100-12-31'||new Date(date+'T12:00:00Z').toISOString().slice(0,10)!==date)throw Error('请选择有效日期');
  const settings=normalizeOptions(options),[y,m,d]=date.split('-').map(Number),[h,min,s]=settings.time.split(':').map(Number);
  const lunar=Solar.fromYmdHms(y,m,d,h,min,s).getLunar(),eight=lunar.getEightChar();eight.setSect(settings.sect);
  const pillars=['Year','Month','Day','Time'].map((part,i)=>({
   label:['年柱','月柱','日柱','时柱'][i],ganzhi:eight['get'+part](),
   wuxing:eight['get'+part+'WuXing'](),nayin:eight['get'+part+'NaYin'](),
   hidden:eight['get'+part+'HideGan']().join(' · '),stemGod:eight['get'+part+'ShiShenGan'](),
   branchGod:eight['get'+part+'ShiShenZhi']().join(' · '),stage:eight['get'+part+'DiShi'](),void:eight['get'+part+'XunKong']()
  }));
  return {settings,pillars,dateLine:pillars.slice(0,3).map((p,i)=>p.ganzhi+['年','月','日'][i]).join('　'),
   dayMaster:eight.getDayGan()+eight.getDayWuXing().slice(0,1),
   lunarLine:lunar.getYearInGanZhi()+'年 '+lunar.getMonthInChinese()+'月'+lunar.getDayInChinese()};
 }
 return {normalizeOptions,calculate};
});
