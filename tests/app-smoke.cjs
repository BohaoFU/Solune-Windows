'use strict';
const {_electron:electron}=require('playwright');
const assert=require('node:assert/strict'),path=require('node:path'),fs=require('node:fs');
const root=path.resolve(__dirname,'..'),testData=path.join(root,'.test-data-smoke');
const screenshotDir=path.resolve(process.env.SOLUNE_SCREENSHOTS||path.join(root,'test-results'));fs.mkdirSync(screenshotDir,{recursive:true});
let app;
async function launch(){return electron.launch({args:[root,'--smoke-test'],env:{...process.env,SOLUNE_TEST_DATA:testData},timeout:60000});}
(async()=>{try{
 app=await launch();let main=await app.firstWindow();await main.waitForSelector('.day-cell.selected');
 const errors=[];for(const p of app.windows())p.on('pageerror',e=>errors.push(e.message));
 assert.equal(await main.evaluate(()=>typeof require),'undefined');assert.equal(await main.evaluate(()=>typeof process),'undefined');
 assert.equal(await main.locator('.day-cell').count(),42);
 await main.evaluate(()=>selectDate('2026-02-17',true));assert.match(await main.locator('#day-detail').innerText(),/正月初一/);
 await main.locator('[data-view="convert"]').click();await main.locator('#solar-date').fill('2023-03-22');await main.locator('#convert-form button[type="submit"]').click();assert.match(await main.locator('#convert-result').innerText(),/闰二月初一/);
 await main.locator('[data-view="calendar"]').click();await main.locator('#add-day-note').click();await main.locator('#note-title').fill('Windows 版离线验证');await main.locator('#note-body').fill('<script>这是文字，不是脚本</script>');await main.locator('#note-form button[type="submit"]').click();await main.waitForSelector('#note-dialog:not([open])');
 const saved=await main.evaluate(()=>JSON.parse(localStorage.getItem('suishi-notes')));assert.ok(saved.some(n=>n.title==='Windows 版离线验证'));
 let panel=app.windows().find(p=>p.url().includes('panel=1'));assert.ok(panel);await panel.waitForSelector('body.flyout');
 assert.equal(await panel.evaluate(()=>JSON.parse(localStorage.getItem('suishi-notes')).some(n=>n.title==='Windows 版离线验证')),true);
 await app.evaluate(({BrowserWindow})=>{const p=BrowserWindow.getAllWindows().find(w=>w.webContents.getURL().includes('panel=1'));p.show();});
 await panel.evaluate(()=>selectDate('2026-02-17',true));await panel.screenshot({path:path.join(screenshotDir,'Solune-panel.png')});
 await panel.locator('#open-full-app').click();await main.locator('#desktop-settings-button').click();await main.locator('#replace-clock').uncheck();assert.equal((await main.evaluate(()=>soluneDesktop.getSettings())).replaceClock,false);await main.locator('#close-desktop-settings').click();
 await main.locator('#theme-btn').click();await main.screenshot({path:path.join(screenshotDir,'Solune-app-dark.png')});await main.locator('#theme-btn').click();await main.screenshot({path:path.join(screenshotDir,'Solune-app.png')});
 assert.equal(await main.evaluate(async()=>{try{await fetch('https://example.com');return false;}catch{return true;}}),true);
 assert.deepEqual(errors,[]);await app.close();app=null;
 app=await launch();main=await app.firstWindow();await main.waitForSelector('.day-cell.selected');assert.ok(await main.evaluate(()=>JSON.parse(localStorage.getItem('suishi-notes')).some(n=>n.title==='Windows 版离线验证')));assert.equal((await main.evaluate(()=>soluneDesktop.getSettings())).replaceClock,false);
 console.log('PASS: lunar calendar, leap month conversion, notes persistence and cross-window sync, desktop settings persistence, sandbox isolation, offline network policy, screenshots.');
 }finally{if(app)await app.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
