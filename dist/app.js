import {createSnippetPreview} from './snippetPreview.js';
import { setupWorkspace, applyDocumentStyle } from './workspace.js';
import { emptyDocument, parseDocument, serializeDocument, PALETTE } from './documentFormat.js';
import { renderDocument, escapeHTML } from './renderer.js';
import { EXAMPLE, GUIDE_TITLE, LEGACY_EXAMPLE_HASH, SNIPPETS } from './examples.js';
import { CATEGORIES } from './snippets.js';
import { createDriveClient, loadGoogleIdentity } from './googleDrive.js';
const $=id=>document.getElementById(id);
let workspace;
const documentStyle=document.createElement('style');documentStyle.id='document-custom-style';document.head.append(documentStyle);
const updateDocumentStyle=()=>applyDocumentStyle(current.style||'',documentStyle);
const STORAGE='wildsea-shrubbery.drafts.v1';
let documents=[], current, loading=false, renderTimer, toastTimer, spread=false, storageFailed=false;
let clientId=window.WILDSEA_CONFIG?.googleClientId||'';
try {clientId=localStorage.getItem('wildsea-shrubbery.oauth-client')||clientId; const data=JSON.parse(localStorage.getItem(STORAGE)||'{}');documents=Array.isArray(data.documents)?data.documents.filter(d=>d && typeof d.id==='string' && typeof d.text==='string' && typeof d.title==='string'):[];current=documents.find(d=>d.id===data.active)||documents[0];}catch{storageFailed=true;}
// Upgrade only the untouched starter; never replace someone's edited or Drive-linked draft.
const fingerprint=text=>{let hash=2166136261;for(let i=0;i<text.length;i++)hash=Math.imul(hash^text.charCodeAt(i),16777619);return hash>>>0;};
for(const doc of documents){if(!doc.drive && doc.title==='The Orchard at the End of the World' && fingerprint(doc.text)===LEGACY_EXAMPLE_HASH){doc.text=EXAMPLE;doc.title=GUIDE_TITLE;}}
if(!current){current={...emptyDocument(EXAMPLE),id:crypto.randomUUID(),title:GUIDE_TITLE,updatedAt:new Date().toISOString()};documents.push(current);}
let drive=createDriveClient({clientId});
const editor=CodeMirror.fromTextArea($('source'),{mode:'markdown',lineNumbers:true,lineWrapping:true,tabSize:2,indentUnit:2,viewportMargin:20,extraKeys:{'Ctrl-S':()=>saveDraft(true),'Cmd-S':()=>saveDraft(true),'Ctrl-Shift-S':()=>saveDrive(false),'Cmd-Shift-S':()=>saveDrive(false),'Tab':cm=>cm.replaceSelection('  ')}});
editor.getWrapperElement().setAttribute('aria-label','Markdown source editor');
editor.on('change',()=>{if(loading)return;current.text=editor.getValue();touch();clearTimeout(renderTimer);renderTimer=setTimeout(render,160);});
editor.on('cursorActivity',()=>{const pos=editor.getCursor();$('cursor').textContent=`Ln ${pos.line+1}, Col ${pos.ch+1}`;});
function toast(message,error=false){clearTimeout(toastTimer);$('toast').textContent=message;$('toast').classList.toggle('error',error);$('toast').hidden=false;toastTimer=setTimeout(()=>$('toast').hidden=true,error?9000:3500);}
function saveDraft(notify=false){
  try {localStorage.setItem(STORAGE,JSON.stringify({active:current.id,documents}));storageFailed=false;$('save-status').textContent='Saved in this browser';$('save-status').classList.remove('storage-error');if(notify)toast('Browser draft saved.');return true;}
  catch{$('save-status').textContent='Browser storage unavailable — download a copy';$('save-status').classList.add('storage-error');if(!storageFailed||notify)toast('Your edits are in memory only. Download Markdown to keep a copy.',true);storageFailed=true;return false;}
}
function touch(){current.updatedAt=new Date().toISOString();saveDraft();}
function selectDocument(doc){loading=true;current=doc;$('title').value=doc.title;editor.setValue(doc.text);editor.clearHistory();loading=false;workspace?.sync();saveDraft();render();$('preview-scroll').scrollTop=0;}
function render(){
  const {pages,warnings}=renderDocument(current);const container=$('pages');container.replaceChildren();
  pages.forEach((page,i)=>{
    const frame=document.createElement('div');frame.className='page-frame size-'+page.size;frame.dataset.page=String(i+1);frame.dataset.width=String(page.width);
    const palette=PALETTE[page.accent];
    const notice=`The Wildsea is the copyright of Quillhound Studios and Felix Isaacs. ${current.title||'[Product name]'} is an independent production by ${current.author||'[Author or Publisher]'} and is not affiliated with Mythworks or Felix Isaacs. It is published under the By Firefly’s Light License.`;
    frame.innerHTML=`<span class="page-label">PAGE ${page.number} · ${page.size==='letter'?'11':'10'} × 8.5 IN</span><article class="sheet size-${page.size} bg-${page.background}" aria-label="Page ${page.number}" style="--accent:${palette.hex};--tint:${palette.tint};--border:${palette.hex}"><div class="page-content">${page.html}</div><span class="folio">${page.number}</span><footer class="license-footer"><p>${escapeHTML(notice)}</p><img src="assets/firefly-license.webp" alt="By Firefly’s Light License"></footer></article>`;
    container.append(frame);
  });
  $('page-count').textContent=`${pages.length} PAGE${pages.length===1?'':'S'}`;
  $('word-count').textContent=`${current.text.trim().split(/\s+/).filter(Boolean).length.toLocaleString()} words`;
  fitPages();
  const inspect=()=>{
    const overflow=[];
    document.querySelectorAll('.page-content').forEach((el,i)=>{
      const footer=el.parentElement.querySelector('.license-footer');
      el.style.height=Math.min(678,footer.offsetTop-el.offsetTop-14)+'px';
      if(el.scrollHeight>el.clientHeight+2||el.scrollWidth>el.clientWidth+2)overflow.push(`Page ${i+1} overflows. Shorten the content or add a page break.`);
    });
    const messages=[...warnings,...overflow];$('warnings').hidden=!messages.length;$('warnings').textContent=messages.join(' ');
  };
  requestAnimationFrame(inspect);document.fonts.ready.then(inspect);
  document.querySelectorAll('.page-content img').forEach(img=>img.addEventListener('load',inspect,{once:true}));
}
function fitPages(){
  const area=$('preview-scroll');const available=area.clientWidth-(innerWidth<=760?30:52);const width=spread?(available-4)/2:available;
  const frames=[...document.querySelectorAll('.page-frame')];const widest=Math.max(960,...frames.map(f=>Number(f.dataset.width)));
  const scale=$('zoom').value==='fit'?Math.max(.18,Math.min(1,width/widest)):Number($('zoom').value);
  frames.forEach(frame=>{frame.style.width=`${Number(frame.dataset.width)*scale}px`;frame.style.height=`${816*scale}px`;frame.querySelector('.sheet').style.transform=`scale(${scale})`;});
}
new ResizeObserver(fitPages).observe($('preview-scroll'));
$('zoom').addEventListener('change',fitPages);
$('spread-button').onclick=()=>{spread=!spread;$('pages').classList.toggle('spreads',spread);$('spread-button').setAttribute('aria-pressed',String(spread));$('spread-button').textContent=spread?'Single pages':'Spreads';fitPages();};
$('title').addEventListener('input',()=>{current.title=$('title').value;touch();render();});
document.querySelectorAll('dialog .close').forEach(button=>button.onclick=()=>closeMenu(button.closest('dialog')));
document.querySelectorAll('dialog').forEach(dialog=>dialog.addEventListener('click',event=>{if(event.target===dialog){const r=dialog.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)closeMenu(dialog);}}));
const menuAnchors={'insert-dialog':'insert-button','settings-dialog':'settings-button','library-dialog':'library-button','drive-dialog':'drive-button','guide-dialog':'guide-button'};
const menuAnchor=dialog=>$(dialog.dataset.anchor||menuAnchors[dialog.id]);
function closeMenu(dialog){
  if(dialog.id==='insert-dialog')snippetPreview.clear();
  document.querySelectorAll(`[aria-controls="${dialog.id}"]`).forEach(button=>button.setAttribute('aria-expanded','false'));
  dialog.close();
}
function positionMenu(dialog){
  const anchor=menuAnchor(dialog);const rect=anchor.getBoundingClientRect();
  dialog.style.left=Math.max(8,Math.min(rect.left,innerWidth-dialog.offsetWidth-8))+'px';
  dialog.style.top=(rect.bottom+7)+'px';
  dialog.style.maxHeight=Math.max(120,innerHeight-rect.bottom-19)+'px';
}
const show=id=>{
  const dialog=$(id);const wasOpen=dialog.open;
  document.querySelectorAll('dialog[open]').forEach(d=>closeMenu(d));
  document.querySelectorAll('[aria-haspopup="dialog"]').forEach(button=>button.setAttribute('aria-expanded','false'));
  if(wasOpen)return;
  dialog.classList.add('dropdown-menu');dialog.show();positionMenu(dialog);
  menuAnchor(dialog).setAttribute('aria-expanded','true');
};
for(const [id,anchorId] of Object.entries(menuAnchors)){
  const anchor=$(anchorId);anchor.setAttribute('aria-haspopup','dialog');anchor.setAttribute('aria-controls',id);anchor.setAttribute('aria-expanded','false');
  anchor.addEventListener('keydown',event=>{if(event.key==='ArrowDown'){event.preventDefault();if(!$(id).open)anchor.click();$(id).querySelector('button:not(.close):not(:disabled),input,select')?.focus();}});
  $(id).addEventListener('close',()=>{document.querySelectorAll(`[aria-controls="${id}"]`).forEach(button=>button.setAttribute('aria-expanded',String($(id).open&&button===menuAnchor($(id)))));});
}
document.addEventListener('click',event=>{document.querySelectorAll('dialog[open]').forEach(d=>{if(!d.contains(event.target)&&!menuAnchor(d).contains(event.target)&&!$('brand').contains(event.target))closeMenu(d);});});
document.addEventListener('keydown',event=>{
  const menu=document.querySelector('dialog[open]');if(!menu)return;
  if(event.key==='Escape'){event.preventDefault();closeMenu(menu);menuAnchor(menu).focus();}
  if(['ArrowDown','ArrowUp'].includes(event.key)&&event.target.matches('button')){
    const buttons=[...menu.querySelectorAll('button:not(:disabled)')];const index=buttons.indexOf(event.target);
    if(index>=0){event.preventDefault();buttons[(index+(event.key==='ArrowDown'?1:-1)+buttons.length)%buttons.length].focus();}
  }
});
window.addEventListener('resize',()=>document.querySelectorAll('dialog[open]').forEach(positionMenu));
$('guide-button').onclick=()=>show('guide-dialog');$('brand').onclick=e=>{e.preventDefault();show('guide-dialog');};
function insertPage(item){
  const source=editor.getValue(),cursor=editor.indexFromPos(editor.getCursor());
  const breaks=[...source.matchAll(/^[ \t]*\\page[ \t]*$/gm)];
  const previous=breaks.filter(m=>m.index<cursor).at(-1);
  const start=previous?previous.index+previous[0].length:0;
  const next=breaks.find(m=>m.index>=cursor);const end=next?next.index:source.length;
  const empty=!source.slice(start,end).trim();const at=empty?start:end;
  const prefix=empty?'\n\n':'\n\n\\page\n\n';
  editor.replaceRange(prefix+item.text+'\n\n',editor.posFromIndex(at),editor.posFromIndex(empty?end:at));
  editor.setCursor(editor.posFromIndex(at+prefix.length));
  clearTimeout(renderTimer);render();
  const index=breaks.filter(m=>m.index<at).length+(empty?0:1);
  $('pages').children[index]?.scrollIntoView({block:'start',behavior:'smooth'});
  const count=item.text.split(/^\\page\s*$/m).length;
  toast(`${item.label} added (${count} ${count===1?'page':'pages'}).`);
}
const snippetPreview=createSnippetPreview($('snippet-preview'),()=>current,()=>{
  const index=editor.getValue().slice(0,editor.indexFromPos(editor.getCursor())).split(/^\s*\\page\s*$/m).length-1;
  return renderDocument(current).pages[index]?.accent||current.accent;
});
$('insert-dialog').addEventListener('close',()=>{if(!$('insert-dialog').open)snippetPreview.clear();});
for(const [category,details] of Object.entries(CATEGORIES)){
  const anchor=$(category==='tables'?'insert-button':category+'-button');
  anchor.setAttribute('aria-haspopup','dialog');anchor.setAttribute('aria-controls','insert-dialog');anchor.setAttribute('aria-expanded','false');
  anchor.onclick=()=>{
    const dialog=$('insert-dialog');
    if(dialog.open&&menuAnchor(dialog)!==anchor)closeMenu(dialog);
    dialog.dataset.anchor=anchor.id;
    dialog.classList.toggle('has-preview',category!=='pages');$('snippet-preview').hidden=category==='pages';snippetPreview.clear();
    $('insert-title').textContent=details.label;$('insert-description').textContent=details.description;
    $('snippet-list').replaceChildren();
    for(const [key,item] of Object.entries(SNIPPETS).filter(([,item])=>item.category===category)){
      const button=document.createElement('button');button.innerHTML=`<strong>${escapeHTML(item.label)}</strong><small>${escapeHTML(item.detail)}</small>`;button.dataset.snippet=key;
      if(category!=='pages'){button.addEventListener('mouseenter',()=>snippetPreview.show(item));button.addEventListener('focus',()=>snippetPreview.show(item));}
      button.onclick=()=>{if(category==='pages')insertPage(item);else{const selected=editor.getSelection();editor.replaceSelection('\n\n'+item.text+'\n'+(selected?'\n'+selected:''),'end');}closeMenu($('insert-dialog'));editor.focus();};$('snippet-list').append(button);
    }
    show('insert-dialog');
  };
  if(category!=='tables')anchor.addEventListener('keydown',event=>{if(event.key==='ArrowDown'){event.preventDefault();if(!$('insert-dialog').open||menuAnchor($('insert-dialog'))!==anchor)anchor.click();$('snippet-list').querySelector('button')?.focus();}});
}
$('settings-button').onclick=()=>{$('accent-scope').value=/^\s*\{\{cover(?:[,\s]|$)|^\s*\{\{page[^\n]*header=true/m.test(editor.getValue())?'section':'document';$('background').value=current.background;$('page-start').value=current.pageStart;$('author').value=current.author||'';updateSwatches();show('settings-dialog');};
$('author').addEventListener('input',()=>{current.author=$('author').value;touch();render();});
function accentSection(){
  const source=editor.getValue();
  const pageIndex=source.slice(0,editor.indexFromPos(editor.getCursor())).split(/^\s*\\page\s*$/m).length-1;
  const pages=renderDocument({...current,text:source}).pages;
  const start=pages[Math.min(pageIndex,pages.length-1)].sectionStart;
  return {source,start,accent:pages[start].accent};
}
function selectedAccent(){return $('accent-scope').value==='section'?accentSection().accent:current.accent;}
$('accent-scope').onchange=updateSwatches;
function setAccent(key){
  if($('accent-scope').value==='document'){current.accent=key;touch();render();}
  else{
    const {source,start}=accentSection();
    const sections=source.split(/^\s*\\page\s*$/m);
    const directive=/^\s*\{\{page\s+([^\n{}]+)\}\}\s*$/m;
    // Consolidate page accent settings so a later directive cannot silently override the selection.
    sections[start]=sections[start].replace(/^(\s*\{\{page\s+)([^\n{}]+)(\}\}\s*)$/gm,(_,a,settings,b)=>a+settings.split(/[,\s]+/).filter(s=>!s.startsWith('accent=')).join(' ')+b);
    if(directive.test(sections[start]))sections[start]=sections[start].replace(directive,(_,settings)=>'{{page '+settings.trim()+' accent='+key+'}}\n');
    else sections[start]='{{page accent='+key+'}}\n'+sections[start];
    const cursor=editor.getCursor();editor.setValue(sections.join('\n\n\\page\n\n'));editor.setCursor(cursor);render();
  }
  updateSwatches();
}
function updateSwatches(){const accent=selectedAccent();document.querySelectorAll('.swatch').forEach(b=>{const selected=b.dataset.color===accent;b.classList.toggle('selected',selected);b.setAttribute('aria-pressed',String(selected));});$('swatch-name').textContent=PALETTE[accent].name+' · '+PALETTE[accent].hex;}
for(const [key,value] of Object.entries(PALETTE)){
  const b=document.createElement('button');b.className='swatch';b.style.background=value.hex;b.dataset.color=key;b.title=value.name+' '+value.hex;b.setAttribute('aria-label',value.name);b.onclick=()=>setAccent(key);$('swatches').append(b);
}
$('background').onchange=()=>{current.background=$('background').value;touch();render();};
$('page-start').onchange=()=>{current.pageStart=Math.max(1,Math.min(9999,parseInt($('page-start').value)||1));$('page-start').value=current.pageStart;touch();render();};
function renderLibrary(){
  $('draft-list').replaceChildren();
  [...documents].sort((a,b)=>b.updatedAt.localeCompare(a.updatedAt)).forEach(doc=>{
    const row=document.createElement('div');row.className='file-item'+(doc.id===current.id?' current':'');
    const open=document.createElement('button');open.className='file-open';open.innerHTML=`<strong>${escapeHTML(doc.title||'Untitled voyage')}</strong><small>${doc.id===current.id?'Currently editing · ':''}${escapeHTML(new Date(doc.updatedAt).toLocaleString())}${doc.drive?' · Linked to Drive':''}</small>`;open.onclick=()=>{selectDocument(doc);closeMenu($('library-dialog'));};
    const del=document.createElement('button');del.className='quiet small';del.textContent='Delete';del.setAttribute('aria-label','Delete '+doc.title);del.onclick=()=>{if(!confirm(`Delete the browser draft “${doc.title}”? This does not delete a Drive file.`))return;documents=documents.filter(d=>d.id!==doc.id);if(current.id===doc.id){if(!documents.length)documents.push({...emptyDocument(),id:crypto.randomUUID(),updatedAt:new Date().toISOString()});selectDocument(documents[0]);}saveDraft();renderLibrary();};
    row.append(open,del);$('draft-list').append(row);
  });
}
$('library-button').onclick=()=>{renderLibrary();show('library-dialog');};
function addDocument(doc){const created={...doc,id:crypto.randomUUID(),updatedAt:new Date().toISOString()};documents.push(created);selectDocument(created);if($('library-dialog').open)closeMenu($('library-dialog'));}
$('new-button').onclick=()=>addDocument(emptyDocument());
$('example-button').onclick=()=>addDocument({...emptyDocument(EXAMPLE),title:GUIDE_TITLE});
$('download-button').onclick=()=>{const blob=new Blob([serializeDocument(current)],{type:'text/markdown;charset=utf-8'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=(current.title||'Untitled voyage').replace(/[\\/:*?"<>|]/g,'-')+'.md';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);toast('Markdown downloaded.');};
$('import-button').onclick=()=>$('import-file').click();
$('import-file').onchange=async()=>{const file=$('import-file').files[0];if(!file)return;try{if(file.size>2000000)throw new Error('Please choose a Markdown file smaller than 2 MB.');addDocument(parseDocument(await file.text()));toast('Markdown imported as a new draft.');}catch(e){toast(e.message,true);}finally{$('import-file').value='';}};
$('print-button').onclick=async()=>{render();await document.fonts.ready;if(!$('warnings').hidden && !confirm('This document has layout warnings. Print anyway?'))return;document.title=current.title||'Wildsea voyage';window.print();};

// Google Drive: dedicated client ID, in-memory tokens, explicit saves.
let driveBusy=false,sdkReady=false;
$('origin').textContent=location.origin;$('client-id').value=clientId;
function updateDriveUI(){
  const connected=drive.connected();
  $('connect-drive').disabled=driveBusy||!clientId||!sdkReady||connected;
  ['save-drive','copy-drive','refresh-drive','disconnect-drive'].forEach(id=>$(id).disabled=driveBusy||!connected);
  $('configure-drive').disabled=driveBusy;
  if(!driveBusy)$('drive-status').textContent=connected?`Connected as ${drive.account().emailAddress || drive.account().displayName}`:clientId?'Ready to connect with your Wildsea OAuth client.':'Add a dedicated Wildsea OAuth client ID to enable Drive.';
}
async function prepareSDK(){if(!clientId)return;try{await loadGoogleIdentity();sdkReady=true;updateDriveUI();}catch(e){sdkReady=false;updateDriveUI();$('drive-status').textContent=e.message;}}
$('drive-button').onclick=()=>{updateDriveUI();show('drive-dialog');prepareSDK();};
$('configure-drive').onclick=()=>{
  const id=$('client-id').value.trim();if(id&&!/^[a-zA-Z0-9_-]+\.apps\.googleusercontent\.com$/.test(id)){toast('Enter the OAuth web client ID, ending in .apps.googleusercontent.com.',true);return;}
  drive.disconnect();clientId=id;drive=createDriveClient({clientId});$('drive-files').replaceChildren();
  try{localStorage.setItem('wildsea-shrubbery.oauth-client',id);}catch{toast('Client ID will be used for this session only.',true);}
  updateDriveUI();prepareSDK();toast(id?'Wildsea client ID configured.':'Drive configuration cleared.');
};
async function driveAction(action){if(driveBusy)return;driveBusy=true;updateDriveUI();try{return await action();}catch(e){$('drive-status').textContent=e.message;toast(e.message,true);}finally{driveBusy=false;const message=$('drive-status').textContent;updateDriveUI();if(!drive.connected())$('drive-status').textContent=message;}}
$('connect-drive').onclick=()=>driveAction(async()=>{await drive.connect();$('drive-status').textContent='Google Drive connected.';toast('Google Drive connected.');await listDrive();});
$('disconnect-drive').onclick=()=>{drive.disconnect();$('drive-files').replaceChildren();updateDriveUI();toast('Disconnected from Google Drive.');};
async function listDrive(){
  const list=$('drive-files');list.textContent='Loading files…';const files=await drive.list();list.replaceChildren();
  if(!files.length){list.textContent='No Wildsea documents here yet. Save this draft to create the first one.';return;}
  files.forEach(file=>{const row=document.createElement('div');row.className='file-item';const b=document.createElement('button');b.className='file-open';b.innerHTML=`<strong>${escapeHTML(file.name)}</strong><small>${escapeHTML(new Date(file.modifiedTime).toLocaleString())}</small>`;b.onclick=()=>driveAction(async()=>{const doc=await drive.open(file.id);addDocument(doc);closeMenu($('drive-dialog'));toast('Opened a fresh browser draft from Drive.');});row.append(b);list.append(row);});
}
async function saveDrive(asNew){
  if(!drive.connected()){updateDriveUI();if(!$('drive-dialog').open)show('drive-dialog');prepareSDK();return;}
  await driveAction(async()=>{
    const snapshot={...current};$('drive-status').textContent='Saving to Google Drive…';const link=await drive.save(snapshot,asNew);
    const draft=documents.find(d=>d.id===snapshot.id);if(draft){draft.drive=link;saveDraft();}
    toast(draft?.text===snapshot.text?'Saved to Google Drive.':'Saved the earlier version. Your latest edits are still in the browser draft.');
    $('drive-status').textContent='Saved to Google Drive.';await listDrive();
  });
}
$('save-drive').onclick=()=>saveDrive(false);$('copy-drive').onclick=()=>saveDrive(true);$('refresh-drive').onclick=()=>driveAction(listDrive);
window.addEventListener('beforeunload',event=>{if(storageFailed){event.preventDefault();event.returnValue='';}});
window.addEventListener('keydown',event=>{if((event.ctrlKey||event.metaKey)&&event.key.toLowerCase()==='s'){event.preventDefault();if(event.shiftKey)saveDrive(false);else saveDraft(true);}});
workspace=setupWorkspace({editor,getDocument:()=>current,changed:touch,render,onStyle:updateDocumentStyle});
selectDocument(current);
