'use strict';
const {_electron:electron}=require('playwright');
const assert=require('node:assert/strict'),path=require('node:path'),fs=require('node:fs');
const root=path.resolve(__dirname,'..'),testData=path.join(root,'.test-data-smoke');
const screenshotDir=path.resolve(process.env.SOLUNE_SCREENSHOTS||path.join(root,'test-results'));fs.mkdirSync(screenshotDir,{recursive:true});
let app;
async function launch(){const executablePath=process.env.SOLUNE_EXECUTABLE;return electron.launch({...(executablePath?{executablePath,args:['--smoke-test']}:{args:[root,'--smoke-test']}),env:{...process.env,SOLUNE_TEST_DATA:testData},timeout:60000});}
async function mainPage(){
 await app.firstWindow();
 for(let i=0;i<200;i++){const page=app.windows().find(p=>p.url().includes('index.html')&&!p.url().includes('panel=1'));if(page){await page.waitForSelector('.day-cell.selected');return page;}await new Promise(r=>setTimeout(r,50));}
 throw Error('Main application window did not load');
}
(async()=>{try{
 app=await launch();let main=await mainPage();await main.waitForSelector('.day-cell.selected');
 await main.evaluate(()=>{localStorage.removeItem('suishi-notes');localStorage.removeItem('suishi-theme');localStorage.removeItem('solune-bazi-options');});await main.reload();await main.waitForSelector('.day-cell.selected');
 const errors=[];for(const p of app.windows())p.on('pageerror',e=>errors.push(e.message));
 assert.equal(await main.evaluate(()=>typeof require),'undefined');assert.equal(await main.evaluate(()=>typeof process),'undefined');
 assert.equal(await main.locator('.day-cell').count(),42);
 await main.evaluate(()=>selectDate('2005-12-23',true));await main.locator('#bazi-time').fill('08:37:00');
 await main.waitForFunction(()=>document.querySelector('#bazi-date').textContent==='乙酉年　戊子月　辛巳日');
 assert.deepEqual(await main.locator('.bazi-pillar strong').allTextContents(),['乙酉','戊子','辛巳','壬辰']);
 await main.locator('.bazi-more summary').click();assert.match(await main.locator('.bazi-detail-grid').innerText(),/泉中水/);
 await main.locator('.bazi-more summary').click();
 await main.evaluate(()=>selectDate('2026-10-24',true));await main.locator('#bazi-time').fill('23:30:00');await main.locator('#bazi-sect').selectOption('2');
 const sameDay=await main.locator('#bazi-date').innerText();await main.locator('#bazi-sect').selectOption('1');
 await main.waitForFunction(before=>document.querySelector('#bazi-date').textContent!==before,sameDay);
 await main.locator('#bazi-time').fill('08:37:00');await main.locator('#bazi-sect').selectOption('2');
 await main.evaluate(()=>selectDate('2026-02-17',true));assert.match(await main.locator('#day-detail').innerText(),/正月初一/);
 await main.locator('[data-view="convert"]').click();await main.locator('#solar-date').fill('2023-03-22');await main.locator('#convert-form button[type="submit"]').click();assert.match(await main.locator('#convert-result').innerText(),/闰二月初一/);
 await main.locator('[data-view="calendar"]').click();await main.locator('#add-day-note').click();await main.locator('#note-title').fill('Windows 版离线验证');await main.locator('#note-body').fill('<script>这是文字，不是脚本</script>');await main.locator('#note-form button[type="submit"]').click();await main.locator('#note-dialog').waitFor({state:'hidden'});
 const saved=await main.evaluate(()=>JSON.parse(localStorage.getItem('suishi-notes')));assert.ok(saved.some(n=>n.title==='Windows 版离线验证'));
 let panel=app.windows().find(p=>p.url().includes('panel=1'));assert.ok(panel);await panel.waitForSelector('body.flyout');
 assert.equal(await panel.evaluate(()=>JSON.parse(localStorage.getItem('suishi-notes')).some(n=>n.title==='Windows 版离线验证')),true);
 await app.evaluate(({BrowserWindow})=>{const p=BrowserWindow.getAllWindows().find(w=>w.webContents.getURL().includes('panel=1'));p.show();});
 await panel.evaluate(()=>selectDate('2026-10-24',true));
 await panel.waitForFunction(()=>document.querySelector('#bazi-time').value==='08:37:00');
 assert.equal(await panel.locator('#bazi-date').innerText(),'丙午年　戊戌月　辛未日');
 const dateBounds=await panel.locator('#bazi-date').boundingBox();assert.ok(dateBounds.y+dateBounds.height<await panel.evaluate(()=>innerHeight));
 await panel.screenshot({animations:'disabled',path:path.join(screenshotDir,'Solune-panel.png')});
 await panel.locator('#open-full-app').click();await main.locator('#desktop-settings-button').click();await main.locator('#replace-clock').check();await main.locator('#replace-clock').uncheck();assert.equal((await main.evaluate(()=>soluneDesktop.getSettings())).replaceClock,false);await main.locator('#startup-app').check();assert.equal((await main.evaluate(()=>soluneDesktop.getSettings())).startup,true);
 await main.locator('#close-desktop-settings').click();assert.equal(await main.locator('#startup-quick').isChecked(),true);
 await main.locator('#startup-quick').uncheck();assert.equal((await main.evaluate(()=>soluneDesktop.getSettings())).startup,false);
 await main.locator('#startup-quick').check();assert.equal((await main.evaluate(()=>soluneDesktop.getSettings())).startup,true);
 await app.evaluate(({BrowserWindow})=>{BrowserWindow.getAllWindows().find(w=>!w.webContents.getURL().includes('panel=1')).setSize(1024,640);});
 await main.locator('#desktop-settings-open').click();await main.locator('#desktop-settings').waitFor({state:'visible'});assert.equal(await main.locator('dialog[open]').count(),1);await main.locator('#close-desktop-settings').click();
 await app.evaluate(({BrowserWindow})=>{BrowserWindow.getAllWindows().find(w=>!w.webContents.getURL().includes('panel=1')).setSize(1280,900);});
 await main.waitForFunction(()=>!document.querySelector('#toast').classList.contains('show'));
 await main.locator('#theme-btn').click();await main.screenshot({animations:'disabled',path:path.join(screenshotDir,'Solune-app-dark.png')});await main.waitForFunction(()=>!document.querySelector('#toast').classList.contains('show'));
 await main.locator('#theme-btn').click();await main.screenshot({animations:'disabled',path:path.join(screenshotDir,'Solune-app.png')});
 assert.equal(await main.evaluate(async()=>{try{await fetch('https://example.com');return false;}catch{return true;}}),true);
 assert.deepEqual(errors,[]);await app.close();app=null;
 app=await launch();main=await mainPage();await main.waitForSelector('.day-cell.selected');assert.ok(await main.evaluate(()=>JSON.parse(localStorage.getItem('suishi-notes')).some(n=>n.title==='Windows 版离线验证')));assert.equal((await main.evaluate(()=>soluneDesktop.getSettings())).replaceClock,false);
 assert.equal((await main.evaluate(()=>soluneDesktop.getSettings())).startup,true);assert.equal(await main.locator('#startup-quick').isChecked(),true);
 assert.equal(await main.locator('#bazi-time').inputValue(),'08:37:00');assert.equal(await main.locator('#bazi-sect').inputValue(),'2');
 await main.locator('#startup-quick').uncheck();await app.close();app=null;
 app=await launch();main=await mainPage();await main.waitForSelector('.day-cell.selected');assert.equal((await main.evaluate(()=>soluneDesktop.getSettings())).startup,false);
 console.log('PASS: four pillars, late Zi rule, synchronized and persistent time preference, startup on/off persistence, lunar calendar, leap month conversion, notes persistence and cross-window sync, desktop settings persistence, sandbox isolation, offline network policy, screenshots.');
 }finally{if(app)await app.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
