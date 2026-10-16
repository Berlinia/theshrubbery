import test from 'node:test';
import assert from 'node:assert/strict';
import {renderDocument} from '../dist/renderer.js';
import {emptyDocument,serializeDocument,parseDocument} from '../dist/documentFormat.js';
import {EXAMPLE} from '../dist/examples.js';
import {SNIPPETS} from '../dist/snippets.js';
test('all menu presets render valid Markdown without unsupported options',()=>{
 for(const [key,item] of Object.entries(SNIPPETS)){
  const result=renderDocument(emptyDocument(item.text));
  assert.deepEqual(result.warnings,[],key);
  assert.equal(result.pages.length,({reach:10,character:2,hazard:2,quickplay:2,scenario:14}[key]||1),key);
 }
});
test('Quickplay has its own width without changing subsequent page dimensions',()=>{
 const {pages}=renderDocument(emptyDocument(SNIPPETS.quickplay.text+'\n\\page\n# Standard page'));
 assert.equal(pages[0].width,1056);assert.equal(pages[0].size,'letter');assert.equal(pages[1].width,1056);assert.equal(pages[2].width,960);
});
test('reference templates preserve their key section sequences',()=>{
 const pages=key=>renderDocument(emptyDocument(SNIPPETS[key].text)).pages.map(p=>p.html);
 const reach=pages('reach');
 assert.match(reach[1],/Main Elements/);
 assert.equal((reach[1].match(/Subsection /g)||[]).length,5);
 assert.equal((reach[2].match(/Territory Name/g)||[]).length,2);
 assert.match(reach[3],/Local Rumours/);
 assert.match(reach[8],/Trade Goods &amp; Cargo/);
 assert.match(reach[9],/Element Name/);
 const quickplay=pages('quickplay');
 assert.match(quickplay[0],/PRE-GAME CHECKS/);
 assert.match(quickplay[1],/THE SECOND ACT/);assert.match(quickplay[1],/THE THIRD ACT/);
 assert.match(quickplay[1],/Encounter Tracks/);
 const scenario=pages('scenario');
 assert.match(scenario[5],/Generating Rooms/);assert.match(scenario[8],/The Crescendo!/);
 assert.match(scenario[12],/track-break/);assert.match(scenario[13],/Credits and Legal/);
 assert.equal((pages('character')[1].match(/Track Length \+ Type/g)||[]).length,16);
});
test('guide exercises six valid pages and nested layouts',()=>{
 const result=renderDocument(emptyDocument(EXAMPLE));assert.equal(result.pages.length,6);assert.deepEqual(result.warnings,[]);
 assert.match(result.pages[0].html,/columns two-one/);assert.match(result.pages[0].html,/columns two/);
 assert.equal((result.pages[1].html.match(/class="box"/g)||[]).length,4);
 assert.match(result.pages[1].html,/--accent:#ECAC42;--tint:#fbefd9;--border:#2d2b2c/);
});
test('field shading preserves an entire multiline visual entry',()=>{
 const {pages}=renderDocument(emptyDocument('{{fields\n**Essentials:** long entry\n**Attitude:** curious\n}}'));
 assert.equal((pages[0].html.match(/class="field"/g)||[]).length,2);assert.match(pages[0].html,/<strong>Essentials:<\/strong>/);
});
test('HTML and dangerous links are inert',()=>{
 const {pages}=renderDocument(emptyDocument('<script>alert(1)</script>\n\n[x](javascript:alert)\n\n![x](data:text/html,evil)\n\n{{accent <img src=x onerror=alert(1)>}}'));
 assert.doesNotMatch(pages[0].html,/<script|<img|href="javascript:/);assert.match(pages[0].html,/&lt;script&gt;/);
});
test('invalid block options cannot inject attributes',()=>{
 const {pages,warnings}=renderDocument(emptyDocument('{{box,accent=red"onclick="evil\nText\n}}'));
 assert.doesNotMatch(pages[0].html,/onclick/);assert.ok(warnings.length);
});
test('unfinished blocks render with a useful warning',()=>{const result=renderDocument(emptyDocument('{{box,olive\nHello'));assert.match(result.pages[0].html,/Hello/);assert.match(result.warnings[0],/closing/);});
test('normal Markdown tables and leaf lists render',()=>{const {pages}=renderDocument(emptyDocument('| Roll | Result |\n|---|---|\n|1|A|\n|2|B|\n\n- One\n- Two'));assert.match(pages[0].html,/<table>/);assert.match(pages[0].html,/<ul>/);});
test('page defaults, overrides and folios are preserved',()=>{const doc={...emptyDocument('{{page background=reach accent=mustard}}\n# First\n\\page\n# Second'),background:'plain',accent:'blue',pageStart:9};const {pages}=renderDocument(doc);assert.equal(pages[0].number,9);assert.equal(pages[1].number,10);assert.equal(pages[0].accent,'mustard');assert.equal(pages[1].accent,'mustard');assert.equal(pages[1].background,'plain');});
test('Markdown metadata round trip retains content and layout',()=>{const doc={...emptyDocument(EXAMPLE),title:'A : complicated “title”',accent:'mustard',pageStart:18};assert.deepEqual(parseDocument(serializeDocument(doc)),doc);});
test('malformed metadata fails without losing original text',()=>{assert.throws(()=>parseDocument('```metadata\ntitle: Missing close'));assert.throws(()=>parseDocument('```metadata\n- array\n```\nHello'));});
test('standalone Markdown imports with heading title',()=>{assert.equal(parseDocument('# My voyage\n\nHello').title,'My voyage');});
test('new and imported documents default to monochrome black',()=>{
 assert.equal(emptyDocument().accent,'black');assert.equal(parseDocument('# Plain').accent,'black');
 const result=renderDocument({text:'{{box\nPlain\n}}'});
 assert.equal(result.pages[0].accent,'black');assert.match(result.pages[0].html,/--accent:#2D2B2C;--tint:#e5e4e4;--border:#2D2B2C/i);
});
test('page accent flows through columns, boxes and fields with scoped overrides',()=>{
 const {pages}=renderDocument(emptyDocument('{{page accent=mustard}}\n{{columns,two\n{{box\n{{fields\n**Detail:** value\n}}\n}}\n\\column\n{{box,black,accent=blue\n{{fields\n**Detail:** other\n}}\n}}\n}}\n{{box\nInherited again\n}}\n\\page\nPlain'));
 assert.match(pages[0].html,/class="box" style="--accent:#ECAC42;--tint:#fbefd9;--border:#ECAC42"/);
 assert.match(pages[0].html,/class="fields" style="--accent:#ECAC42/);
 assert.match(pages[0].html,/class="fields" style="--accent:#175D7E/);
 assert.match(pages[0].html,/--border:#ECAC42">\s*<p>Inherited again/);
 assert.equal(pages[1].accent,'mustard');
});
test('3|2|5 track draws ten circles with breaks after three and five',()=>{
 const {pages}=renderDocument(emptyDocument('**Track:** {{track 3|2|5}}'));
 assert.equal((pages[0].html.match(/class="track-circle"/g)||[]).length,10);
 assert.equal((pages[0].html.match(/class="track-break"/g)||[]).length,2);
 assert.equal((pages[0].html.match(/class="track-connector"/g)||[]).length,9);
 assert.match(pages[0].html,/data-after="3"/);assert.match(pages[0].html,/data-after="5"/);
});
test('tracks work inside fields and accept an unbroken group',()=>{
 const {pages}=renderDocument(emptyDocument('{{fields\n**Progress:** {{track 6}}\n}}'));
 assert.equal((pages[0].html.match(/class="track-circle"/g)||[]).length,6);assert.doesNotMatch(pages[0].html,/class="track-break"/);
});
test('invalid and excessive track sizes show an error without allocating circles',()=>{
 for(const pattern of ['0','3||2','-2','100000000','2.5','3|0|2']){
 const {pages}=renderDocument(emptyDocument('{{track '+pattern+'}}'));assert.match(pages[0].html,/Invalid track/);assert.doesNotMatch(pages[0].html,/<circle/);
 }
});

test('header accents persist across pages, local overrides do not leak, and new headers reset',()=>{
 const text=['{{page accent=willow}}\n{{cover\n# Reach one\n}}','# Main Elements','{{page accent=red}}\n# Local override','# Territory','{{page header=true accent=blue}}\n# Reach two','# Port','{{cover\n# Uncoloured reach\n}}','# Faction'].join('\n\\page\n');
 const result=renderDocument(emptyDocument(text));
 assert.deepEqual(result.warnings,[]);
 assert.deepEqual(result.pages.map(p=>p.accent),['willow','willow','red','willow','blue','blue','black','black']);
 assert.deepEqual(result.pages.map(p=>p.sectionStart),[0,0,0,0,4,4,6,6]);
});
