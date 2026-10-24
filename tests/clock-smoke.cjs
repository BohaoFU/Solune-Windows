'use strict';
// Run only in an interactive Windows desktop. It installs no persistent changes and clicks nothing.
const {_electron:electron}=require('playwright'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..');
(async()=>{let app;try{
 const executablePath=process.env.SOLUNE_EXECUTABLE;app=await electron.launch({...(executablePath?{executablePath,args:['--clock-test','--background']}:{args:[root,'--clock-test','--background']}),env:{...process.env,SOLUNE_TEST_DATA:path.join(root,'.test-data-clock')},timeout:60000});
 const main=await app.firstWindow();await main.waitForFunction(()=>window.soluneDesktop);
 await main.evaluate(()=>soluneDesktop.updateSetting('replaceClock',true));
 await main.waitForFunction(async()=> (await soluneDesktop.getSettings()).status.startsWith('已接管'),null,{timeout:20000});
 const settings=await main.evaluate(()=>soluneDesktop.getSettings());assert.equal(settings.replaceClock,true);console.log('PASS: native clock hook installed and the real taskbar clock was identified.');
 await main.evaluate(()=>soluneDesktop.updateSetting('replaceClock',false));
 await main.waitForFunction(async()=> (await soluneDesktop.getSettings()).status==='系统时钟保持原样');
 console.log('PASS: disabling routing stops the bridge and restores the system clock behavior.');
 }finally{if(app)await app.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
