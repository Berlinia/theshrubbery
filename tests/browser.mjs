import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const browser=await chromium.launch({headless:true,channel:process.env.BROWSER_CHANNEL||'msedge'});
const page=await browser.newPage({viewport:{width:1600,height:1000}});
const errors=[];page.on('pageerror',e=>errors.push(e.message));
await fs.mkdir('tmp/pdfs',{recursive:true});
try{
 await page.goto('http://localhost:4173');await page.waitForSelector('.sheet');await page.evaluate(()=>document.fonts.ready);
 assert.equal(await page.locator('.sheet').count(),8);
 assert.equal(await page.locator('#warnings').isVisible(),false);
 assert.equal(await page.locator('.license-footer').count(),8);
 assert.ok(await page.locator('.license-footer').evaluateAll(es=>es.every(e=>e.textContent.includes('Quillhound Studios and Felix Isaacs')&&e.querySelector('img').complete)));
 assert.ok(await page.locator('.sheet').evaluateAll(es=>es.every(e=>{const content=e.querySelector('.page-content').getBoundingClientRect();const footer=e.querySelector('.license-footer').getBoundingClientRect();return content.bottom<footer.top;})));
 const showcase=page.locator('.sheet').nth(6);
 assert.equal(await showcase.locator('table').count(),8);
 assert.equal(await page.locator('.sheet').nth(7).locator('table').count(),8);
 for(const index of [6,7]) {
  const tables=page.locator('.sheet').nth(index).locator('table');
  for(const table of await tables.all()) {
   assert.equal(await table.locator('tbody tr').count(),2);
   for(const text of await table.locator('tbody td:last-child').allTextContents()) assert.equal(text.trim().split(/\s+/).length,3);
  }
 }
 assert.equal(await page.locator('.sheet').nth(7).getByRole('heading', {name:'Dark Green Table',exact:true}).count(),1);
 assert.equal(await page.getByRole('heading',{name:'Ink Table',exact:true}).count(),0);
 await page.locator('.sheet').nth(7).screenshot({path:'tmp/pdfs/palette-guide-dark-green.png'});
 await showcase.screenshot({path:'tmp/pdfs/palette-guide.png'});
 await page.locator('#insert-button').click();
 assert.equal(await page.locator('dialog:modal').count(),0);
 assert.equal(await page.locator('#insert-button').getAttribute('aria-expanded'),'true');
 await page.locator('#insert-button').click();assert.equal(await page.locator('#insert-dialog').isVisible(),false);
 await page.screenshot({path:'tmp/pdfs/workshop-desktop.png'});
 await page.locator('.sheet').nth(1).screenshot({path:'tmp/pdfs/broadcast-page.png'});
 await page.locator('.sheet').nth(2).screenshot({path:'tmp/pdfs/locations-page.png'});
 await page.pdf({path:'tmp/pdfs/print-verification.pdf',preferCSSPageSize:true,printBackground:true});
 await page.locator('#spread-button').click();assert.equal(await page.locator('.preview-panel #pages').getAttribute('class'),'spreads');
 await page.locator('#zoom').selectOption('0.75');assert.match(await page.locator('.sheet').first().getAttribute('style'),/scale\(0.75\)/);
 await page.locator('#spread-button').click();await page.locator('#zoom').selectOption('fit');
 await page.locator('#drive-button').click();assert.equal(await page.locator('#client-id').inputValue(),'');assert.equal(await page.locator('#connect-drive').isDisabled(),true);
 await page.locator('#drive-dialog .close').click();
 await page.locator('#library-button').click();await page.locator('#new-button').click();assert.equal(await page.locator('.sheet').count(),1);
 await page.locator('#title').fill('Browser verification voyage');
 await page.locator('#blocks-button').click();await page.locator('[data-snippet="box"]').click();await page.waitForTimeout(220);assert.equal(await page.locator('.sheet .box').count(),1);
 await page.locator('#blocks-button').click();await page.locator('[data-snippet="track"]').click();await page.waitForTimeout(220);
 assert.equal(await page.locator('.sheet .track-circle').count(),10);assert.equal(await page.locator('.sheet .track-break').count(),2);
 await page.screenshot({path:'tmp/pdfs/track-preview.png'});
 await page.locator('#insert-button').click();await page.screenshot({path:'tmp/pdfs/dropdown-preview.png'});await page.keyboard.press('Escape');
 assert.equal(await page.locator('#insert-dialog').isVisible(),false);
 await page.locator('#settings-button').click();await page.locator('#background').selectOption('plain');await page.locator('[data-color="mustard"]').click();await page.locator('#page-start').fill('18');await page.locator('#page-start').dispatchEvent('change');await page.locator('#settings-dialog .close').click();
 assert.match(await page.locator('.sheet').getAttribute('class'),/bg-plain/);assert.equal(await page.locator('.folio').textContent(),'18');
 assert.equal(await page.locator('.sheet .box').evaluate(el=>getComputedStyle(el).borderTopColor),'rgb(45, 43, 44)');
 assert.equal(await page.locator('.sheet .track').evaluate(el=>getComputedStyle(el).color),'rgb(236, 172, 66)');
 await page.locator('#settings-button').click();await page.locator('#author').fill('Test Publisher');await page.locator('#settings-dialog .close').click();
 assert.match(await page.locator('.license-footer').textContent(),/independent production by Test Publisher/);
 await page.reload();await page.waitForSelector('.sheet');assert.equal(await page.locator('#title').inputValue(),'Browser verification voyage');assert.equal(await page.locator('.sheet .box').count(),1);assert.equal(await page.locator('.folio').textContent(),'18');
 assert.match(await page.locator('.license-footer').textContent(),/Test Publisher/);
 await page.locator('#library-button').click();const downloadPromise=page.waitForEvent('download');await page.locator('#download-button').click();const download=await downloadPromise;assert.equal(download.suggestedFilename(),'Browser verification voyage.md');const source=await fs.readFile(await download.path(),'utf8');assert.match(source,/background: plain/);assert.match(source,/\{\{box/);
 await page.locator('#import-file').setInputFiles({name:'imported.md',mimeType:'text/markdown',buffer:Buffer.from('# Imported voyage\n\n{{fields\n**First:** One\n**Second:** Two\n}}\n\n| Roll | Result |\n|---|---|\n|1|A|\n|2|B|')});await page.waitForTimeout(250);assert.equal(await page.locator('#title').inputValue(),'Imported voyage');assert.equal(await page.locator('.field').count(),2);assert.equal(await page.locator('tbody tr').count(),2);
 await page.evaluate(()=>document.querySelector('.CodeMirror').CodeMirror.setValue('# Too much text\n\n'+('A long paragraph of test text. '.repeat(2000))));await page.waitForTimeout(300);assert.match(await page.locator('#warnings').textContent(),/overflows/);
 await page.evaluate(()=>document.querySelector('.CodeMirror').CodeMirror.setValue('# Unsafe markup\n\n<script>window.UNSAFE=true</script>\n\n[x](javascript:alert)'));await page.waitForTimeout(220);assert.equal(await page.evaluate(()=>window.UNSAFE),undefined);assert.equal(await page.locator('.sheet script').count(),0);
 await page.setViewportSize({width:700,height:900});await page.screenshot({path:'tmp/pdfs/workshop-mobile.png'});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
 assert.deepEqual(errors,[]);console.log('PASS: browser editing, reload, blocks, defaults, spread/zoom, unconfigured Drive, Markdown download/import, overflow and safe markup. Print PDF generated.');
}finally{await browser.close();}
