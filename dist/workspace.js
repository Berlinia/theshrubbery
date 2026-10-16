import {PALETTE, BACKGROUNDS} from './documentFormat.js';

export function customSnippets(source='') {
  const entries=[...source.matchAll(/^\\snippet[ \t]+(.+)[ \t]*$/gm)];
  return entries.map((m,i)=>({label:m[1].trim(),text:source.slice(m.index+m[0].length,entries[i+1]?.index??source.length).trim()})).filter(s=>s.text);
}

// Parse CSS before scoping it: document styles cannot restyle the application menus.
export function applyDocumentStyle(source,element) {
  const sheet=new CSSStyleSheet();
  try {
    sheet.replaceSync(source||'');
    const keep=rules=>[...rules].map(rule=>{
      if(rule.type===CSSRule.STYLE_RULE)return rule.cssText;
      if(rule.type===CSSRule.MEDIA_RULE)return `@media ${rule.conditionText}{${keep(rule.cssRules)}}`;
      if(rule.type===CSSRule.SUPPORTS_RULE)return `@supports ${rule.conditionText}{${keep(rule.cssRules)}}`;
      return '';
    }).join('\n');
    element.textContent=`@scope (#pages) {${keep(sheet.cssRules)}}`;
  } catch {element.textContent='';}
}

export function setupWorkspace({editor,getDocument,changed,render,onStyle}) {
  const $=id=>document.getElementById(id);
  let syncing=false;
  const options={lineNumbers:true,lineWrapping:true,tabSize:2,indentUnit:2};
  const styleEditor=CodeMirror.fromTextArea($('style-source'),{...options,mode:'css'});
  const snippetEditor=CodeMirror.fromTextArea($('snippet-source'),{...options,mode:'markdown'});
  styleEditor.getWrapperElement().setAttribute('aria-label','Style source editor');
  snippetEditor.getWrapperElement().setAttribute('aria-label','Custom snippets editor');
  styleEditor.on('change',()=>{if(syncing)return;getDocument().style=styleEditor.getValue();changed();onStyle();render();});
  snippetEditor.on('change',()=>{if(syncing)return;getDocument().snippets=snippetEditor.getValue();changed();refreshSnippets();});
  const fields=['title','author','description','tags','language','background','accent','pageStart'];
  for(const key of BACKGROUNDS)$('property-background').add(new Option(key,key));
  for(const [key,value]of Object.entries(PALETTE))$('property-accent').add(new Option(value.name,key));
  const syncProperties=()=>{const doc=getDocument();for(const field of fields)$('property-'+field).value=doc[field]??(field==='pageStart'?1:'');};
  for(const field of fields)$('property-'+field).addEventListener('input',event=>{
    const value=event.target.value;
    getDocument()[field]=field==='pageStart'?Math.max(1,Math.min(9999,Number(value)||1)):value;
    if(field==='title')$('title').value=value;
    changed();render();
  });
  const tabs=[...document.querySelectorAll('[data-editor-view]')];
  function show(view){
    document.querySelectorAll('dialog[open]').forEach(d=>d.close());
    for(const tab of tabs){const active=tab.dataset.editorView===view;tab.setAttribute('aria-selected',String(active));tab.tabIndex=active?0:-1;}
    for(const panel of document.querySelectorAll('[data-editor-panel]'))panel.hidden=panel.dataset.editorPanel!==view;
    $('snippet-toolbar').hidden=view!=='text';
    if(view==='properties')syncProperties();
    if(view==='text')editor.refresh();
    if(view==='style')styleEditor.refresh();
    if(view==='snippets')snippetEditor.refresh();
  }
  for(const [index,tab]of tabs.entries()){
    tab.onclick=()=>show(tab.dataset.editorView);
    tab.onkeydown=e=>{if(!['ArrowLeft','ArrowRight','Home','End'].includes(e.key))return;e.preventDefault();const next=e.key==='Home'?0:e.key==='End'?tabs.length-1:(index+(e.key==='ArrowRight'?1:-1)+tabs.length)%tabs.length;tabs[next].click();tabs[next].focus();};
  }
  function refreshSnippets(){
    const list=$('custom-snippet-list');list.replaceChildren();
    for(const item of customSnippets(getDocument().snippets)){
      const button=document.createElement('button');button.textContent=item.label;
      button.onclick=()=>{show('text');editor.replaceSelection('\n\n'+item.text+'\n\n','end');editor.focus();};list.append(button);
    }
    $('custom-snippet-empty').hidden=list.childElementCount>0;
  }
  $('custom-button').onclick=()=>show('snippets');
  $('snippet-example').onclick=()=>snippetEditor.replaceRange('\n\\snippet Named box\n{{box\n### Heading\nWrite your reusable text here.\n}}\n',CodeMirror.Pos(snippetEditor.lastLine()));
  $('style-example').onclick=()=>styleEditor.replaceRange('\n/* Document typography */\n.sheet h1 { font-size: 46px; }\n.sheet .page-content p { line-height: 1.5; }\n',CodeMirror.Pos(styleEditor.lastLine()));
  $('property-section-style').onclick=()=>$('settings-button').click();
  function sync(){syncing=true;styleEditor.setValue(getDocument().style||'');snippetEditor.setValue(getDocument().snippets||'');styleEditor.clearHistory();snippetEditor.clearHistory();syncing=false;syncProperties();refreshSnippets();onStyle();}
  show('text');
  return {sync};
}
