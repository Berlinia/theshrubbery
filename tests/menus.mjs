import assert from 'node:assert/strict';
import {SNIPPETS} from '../dist/snippets.js';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
const browser=await chromium.launch({headless:true,channel:process.env.BROWSER_CHANNEL||'msedge'});
const page=await browser.newPage({viewport:{width:1600,height:1000}});
const errors=[];page.on('pageerror',e=>errors.push(e.message));
const setSource=async text=>{await page.evaluate(text=>{const cm=document.querySelector('.CodeMirror').CodeMirror;cm.setValue(text);cm.setCursor({line:0,ch:0});},text);await page.waitForTimeout(200);};
try{
 await page.goto('http://localhost:4173');await page.waitForSelector('.sheet');await page.evaluate(()=>document.fonts.ready);
 await page.locator('#insert-button').click();assert.equal(await page.locator('#snippet-list button').count(),8);
 await page.locator('#columns-button').click();assert.equal(await page.locator('#snippet-list button').count(),5);
 assert.equal(await page.locator('#insert-button').getAttribute('aria-expanded'),'false');
 assert.equal(await page.locator('#columns-button').getAttribute('aria-expanded'),'true');
 await page.locator('#blocks-button').click();assert.equal(await page.locator('#snippet-list button').count(),6);
 await page.locator('#pages-button').click();assert.equal(await page.locator('#snippet-list button').count(),7);
 await page.screenshot({path:'tmp/pdfs/page-template-menu.png'});await page.keyboard.press('Escape');
 assert.equal(await page.locator('#pages-button').getAttribute('aria-expanded'),'false');
 for(const [key,item] of Object.entries(SNIPPETS).filter(([,s])=>s.category==='pages')){
  await setSource('');await page.locator('#pages-button').click();await page.locator(`[data-snippet="${key}"]`).click();await page.waitForTimeout(250);
  const count=({reach:10,character:2,hazard:2,quickplay:2,scenario:14}[key]||1);
  assert.equal(await page.locator('.sheet').count(),count,key);
  assert.equal(await page.locator('#warnings').isVisible(),false,key+': '+await page.locator('#warnings').textContent());
  assert.equal(await page.locator('.license-footer').count(),count);
  for(let i=0;i<count;i++)await page.locator('.sheet').nth(i).screenshot({path:`tmp/pdfs/template-${key}-${i+1}.png`});
 }
 // Inserting inside a nested block adds a complete page after that block's page.
 const original='{{box\nOriginal content\n}}\n\n\\page\n# Last page';await setSource(original);
 await page.evaluate(()=>document.querySelector('.CodeMirror').CodeMirror.setCursor({line:1,ch:4}));
 await page.locator('#pages-button').click();await page.locator('[data-snippet="quickplay"]').click();await page.waitForTimeout(250);
 assert.equal(await page.locator('.sheet').count(),4);
 assert.equal(await page.locator('.sheet').nth(0).locator('.box').textContent(),'Original content\n');
 assert.equal(await page.locator('.sheet').nth(1).evaluate(el=>el.offsetWidth),1056);
 assert.match(await page.locator('.sheet').nth(3).textContent(),/Last page/);
 assert.equal(await page.locator('#warnings').isVisible(),false);
 await page.pdf({path:'tmp/pdfs/mixed-template-sizes.pdf',preferCSSPageSize:true,printBackground:true});
 await setSource(SNIPPETS.plainTable.text+'\n'+SNIPPETS.ruledTable.text+'\n'+SNIPPETS.rollTable.text);
 assert.equal(await page.locator('.table.plain tbody tr').first().evaluate(el=>getComputedStyle(el).backgroundColor),'rgba(0, 0, 0, 0)');
 assert.equal(await page.locator('.table.ruled td').first().evaluate(el=>getComputedStyle(el).borderBottomWidth),'1px');
 await page.setViewportSize({width:700,height:900});await page.locator('#pages-button').click();
 assert.ok(await page.locator('#insert-dialog').evaluate(el=>{const r=el.getBoundingClientRect();return r.left>=0&&r.right<=innerWidth&&r.bottom<=innerHeight;}));
 assert.deepEqual(errors,[]);console.log('PASS: four menu categories, all page presets fit, safe page insertion, table styles, mobile dropdown, mixed-size PDF.');
}finally{await browser.close();}
