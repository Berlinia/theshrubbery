import assert from 'node:assert/strict';
import {SNIPPETS} from '../dist/snippets.js';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
const browser=await chromium.launch({headless:true,channel:process.env.BROWSER_CHANNEL||'msedge'});
const page=await browser.newPage({viewport:{width:1600,height:1000}});
const errors=[];page.on('pageerror',e=>errors.push(e.message));
try{
 await page.goto('http://localhost:4173');await page.waitForSelector('#pages .sheet');
 const source='{{page accent=red}}\n# Preview checks';
 await page.evaluate(source=>{const cm=document.querySelector('#panel-text .CodeMirror').CodeMirror;cm.setValue(source);cm.setCursor({line:1,ch:2});},source);
 await page.waitForTimeout(250);
 for(const category of ['tables','columns','blocks']){
  await page.locator(category==='tables'?'#insert-button':`#${category}-button`).click();
  for(const [key,item]of Object.entries(SNIPPETS).filter(([,s])=>s.category===category)){
   await page.locator(`[data-snippet="${key}"]`).hover();
   assert.equal(await page.locator('#snippet-preview #label').textContent(),item.label);
   assert.ok(await page.locator('#snippet-preview .page-content').textContent());
   assert.equal(await page.locator('#snippet-preview .sheet').evaluate(el=>el.style.getPropertyValue('--accent')),'#BB434E');
  }
  await page.keyboard.press('Escape');
  assert.equal(await page.locator('#snippet-preview .sheet').count(),0);
 }
 assert.equal(await page.locator('#panel-text .CodeMirror').evaluate(el=>el.CodeMirror.getValue()),source);
 await page.locator('#blocks-button').click();await page.locator('[data-snippet="track"]').focus();
 assert.equal(await page.locator('#snippet-preview .track-circle').count(),10);
 await page.keyboard.press('Escape');
 await page.setViewportSize({width:500,height:850});
 await page.locator('#insert-button').click();await page.locator('[data-snippet="table"]').focus();
 assert.ok(await page.locator('#insert-dialog').evaluate(el=>{const r=el.getBoundingClientRect();return r.left>=0&&r.right<=innerWidth&&r.bottom<=innerHeight;}));
 assert.deepEqual(errors,[]);
 console.log('PASS: all 19 hover previews, current accent, keyboard focus, cleanup, unchanged source, mobile placement.');
}finally{await browser.close();}
