import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import {EXAMPLE} from '../dist/examples.js';
import {SNIPPETS} from '../dist/snippets.js';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
const browser=await chromium.launch({headless:true,channel:process.env.BROWSER_CHANNEL||'msedge'});
const page=await browser.newPage({viewport:{width:1440,height:1000},deviceScaleFactor:1});
await fs.mkdir('docs/images',{recursive:true});
await fs.mkdir('tmp/pdfs',{recursive:true});
const source=async text=>{await page.locator('#panel-text .CodeMirror').evaluate((el,text)=>{el.CodeMirror.setValue(text);el.CodeMirror.setCursor({line:0,ch:0});},text);await page.waitForTimeout(250);};
try{
 await page.goto('http://localhost:4173');await page.waitForSelector('#pages .sheet');await page.evaluate(()=>document.fonts.ready);
 await source(EXAMPLE);
 assert.equal(await page.locator('#warnings').textContent(),'');
 await page.screenshot({path:'docs/images/workshop.png'});
 for(let i=3;i<6;i++)await page.locator('#pages > .page-frame').nth(i).screenshot({path:`tmp/pdfs/guide-expanded-${i+1}.png`});
 await source('{{page accent=red}}\n# PREVIEW BEFORE YOU INSERT\nHover over an option in Tables, Columns, or Blocks.');
 for(const [category,button,key]of [['tables','insert','boxedTable'],['columns','columns','nestedColumns'],['blocks','blocks','track']]){
  await page.locator(`#${button}-button`).click();await page.locator(`[data-snippet="${key}"]`).hover();
  await page.locator('#insert-dialog').screenshot({path:`docs/images/${category}.png`});await page.keyboard.press('Escape');
 }
 await source(SNIPPETS.reach.text);await page.locator('#pages > .page-frame').nth(1).screenshot({path:'docs/images/reach-elements.png'});
 await page.locator('#pages > .page-frame').nth(2).screenshot({path:'docs/images/reach-territories.png'});
 console.log('PASS: six guide pages fit; captured README menu and template walkthrough images.');
}finally{await browser.close();}
