import { Marked } from './vendor/marked.js';
import { PALETTE, BACKGROUNDS } from './documentFormat.js';
export const escapeHTML = (s) => String(s).replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const safeURL = (url) => /^(https?:\/\/|#[a-zA-Z0-9_-]+)/.test(url) ? escapeHTML(url) : '';
const markdown = new Marked({gfm:true, breaks:false});
markdown.use({renderer:{
  html(token) { return escapeHTML(token.text); },
  link(token) { const url=safeURL(token.href); const text=this.parser.parseInline(token.tokens); return url ? `<a href="${url}" target="_blank" rel="noopener noreferrer">${text}</a>` : text; },
  image(token) { const url=safeURL(token.href); return url && !url.startsWith('#') ? `<img src="${url}" alt="${escapeHTML(token.text)}" referrerpolicy="no-referrer">` : escapeHTML(token.text); }
}, extensions:[{
  name:'track',level:'inline',start(src){return src.indexOf('{{track ');},
  tokenizer(src){const m=/^\{\{track\s+([^\n{}]*)\}\}/.exec(src);if(m)return {type:'track',raw:m[0],pattern:m[1]};},
  renderer(token){
    const pattern=token.pattern.replace(/\s/g,'');
    const groups=pattern.split('|').map(Number);
    const total=groups.reduce((sum,n)=>sum+n,0);
    if(!/^\d+(?:\|\d+)*$/.test(pattern)||groups.some(n=>n<1)||total>60)
      return '<span class="track-error">Invalid track: use positive groups such as 3|2|5 (maximum 60 circles).</span>';
    // Scenario IDML: radius ~4.97 pt, stroke ~1.72 pt (96 px / 72 pt).
    const radius=6.63;let x=9,count=0,shapes='';const breaks=[];
    groups.forEach((group,index)=>{
      for(let i=0;i<group;i++){
        if(count){
          const isBreak=index>0&&i===0;const previous=x;x+=isBreak?30:21;
          shapes+=`<path class="track-connector" d="M${previous+radius} 9H${x-radius}"/>`;
          if(isBreak){breaks.push(count);shapes+=`<path class="track-break" data-after="${count}" d="M${(previous+x)/2} 5v8"/>`;}
        }
        shapes+=`<circle class="track-circle" cx="${x}" cy="9" r="${radius}"/>`;count++;
      }
    });
    const label=`${total}-circle track${breaks.length?'; breaks after circles '+breaks.join(' and '):'; no breaks'}`;
    return `<svg class="track" xmlns="http://www.w3.org/2000/svg" width="${x+9}" height="18" viewBox="0 0 ${x+9} 18" role="img" aria-label="${label}"><title>${label}</title>${shapes}</svg>`;
  }
},{
  name:'accent',level:'inline',start(src){return src.indexOf('{{');},
  tokenizer(src){const m=/^\{\{(accent|muted)\s+([^\n]*?)\}\}/.exec(src);if(m)return {type:'accent',raw:m[0],kind:m[1],tokens:this.lexer.inlineTokens(m[2])};},
  renderer(token){return `<span class="${token.kind}">${this.parser.parseInline(token.tokens)}</span>`;}
}]});
const blocks = new Set(['box','note','fields','table','columns','wide','flavor','banner','cover','compact']);
const variants = new Set(['two','three','two-one','one-two']);
const tableVariants = new Set(['plain','ruled','compact','roll']);
function parseNodes(lines,warnings) {
  const root={children:[]};const stack=[root];
  for(const line of lines) {
    const parent=stack.at(-1);
    if(line.trim()==='}}') { if(stack.length>1) stack.pop();else warnings.push('A closing }} has no matching block.');continue; }
    const open=/^\s*\{\{([a-z][^{}]*)\s*$/.exec(line);
    if(open) {
      const parts=open[1].trim().split(/[,\s]+/);const kind=parts.shift();
      if(!blocks.has(kind)) {warnings.push(`Unknown block “${kind}”. Use a preset from the insertion menus.`);continue;}
      if(stack.length>20) {warnings.push('Too many nested blocks.');continue;}
      const node={type:'block',kind,options:parts,children:[]};parent.children.push(node);stack.push(node);continue;
    }
    if(/^\s*\\column\s*$/.test(line)) {parent.children.push({type:'column'});continue;}
    let text=parent.children.at(-1);
    if(text?.type!=='text') {text={type:'text',value:''};parent.children.push(text);}
    text.value+=line+'\n';
  }
  if(stack.length>1)warnings.push(`${stack.length-1} block(s) need a closing }}.`);
  return root.children;
}
function renderNodes(nodes,context,warnings) {
  return nodes.map(node=>{
    if(node.type==='text') return markdown.parse(node.value);
    if(node.type==='column') {warnings.push('Put \\column inside a columns block, or between top-level columns.');return '';}
    const {kind,options}=node;
    let accent=context.accent,border=null;
    for(const option of options) {
      if(option.startsWith('accent=')) {const color=option.slice(7);if(Object.hasOwn(PALETTE,color))accent=color;else warnings.push(`Unknown accent “${color}”.`);}
      else if(Object.hasOwn(PALETTE,option)) border=option;
      else if(!variants.has(option)&&!(kind==='table'&&tableVariants.has(option))) warnings.push(`Unknown option “${option}”.`);
    }
    const colors=PALETTE[accent];
    const style=`--accent:${colors.hex};--tint:${colors.tint};--border:${PALETTE[border||accent].hex}`;
    if(kind==='columns') {
      const layout=options.find(v=>variants.has(v))||'two';
      const groups=[[]];for(const child of node.children) {if(child.type==='column')groups.push([]);else groups.at(-1).push(child);}
      const count=layout==='three'?3:2;
      if(groups.length>count)warnings.push(`A ${layout} columns block has ${groups.length} columns. Extra columns start another row.`);
      return `<div class="columns ${layout}" style="${style}">${groups.map(group=>`<div class="column">${renderNodes(group,{accent},warnings)}</div>`).join('')}</div>`;
    }
    if(kind==='fields') {
      const rows=node.children.flatMap(n=>n.type==='text'?n.value.split('\n').filter(l=>l.trim()):[]);
      return `<div class="fields" style="${style}">${rows.map(row=>`<div class="field">${markdown.parseInline(row)}</div>`).join('')}</div>`;
    }
    const classes=kind==='table'?['table',...options.filter(o=>tableVariants.has(o))].join(' '):kind==='note'?'box':kind;
    return `<div class="${classes}" style="${style}">${renderNodes(node.children,{accent},warnings)}</div>`;
  }).join('');
}
export function renderDocument(doc) {
  const warnings=[];
  const defaultAccent=Object.hasOwn(PALETTE,doc.accent)?doc.accent:'black';
  let sectionAccent=defaultAccent,sectionStart=0;
  const sections=doc.text.replace(/\r\n?/g,'\n').split(/^\s*\\page\s*$/m);
  const pages=sections.map((source,index)=>{
    const header=/^\s*\{\{cover(?:[,\s]|$)/m.test(source)||/^\s*\{\{page\s+[^\n{}]*\bheader=true\b[^\n{}]*\}\}/m.test(source);
    if(header){sectionAccent=defaultAccent;sectionStart=index;}
    let background=BACKGROUNDS.includes(doc.background)?doc.background:'canopy';
    let accent=sectionAccent;
    let size='wildsea';
    const pageWarnings=[];
    source=source.replace(/^\s*\{\{page\s+([^\n{}]+)\}\}\s*$/gm,(_,settings)=>{
      for(const part of settings.trim().split(/[,\s]+/)) {
        const [key,value]=part.split('=');
        if(key==='background'&&BACKGROUNDS.includes(value))background=value;
        else if(key==='accent'&&Object.hasOwn(PALETTE,value))accent=value;
        else if(key==='size'&&['wildsea','letter'].includes(value))size=value;
        else if(key==='header'&&value==='true'){} // Section boundary; ordinary headings are not boundaries.
        else pageWarnings.push(`Unknown page setting “${part}”.`);
      }return '';
    });
    if(header||index===0)sectionAccent=accent;
    let nodes=parseNodes(source.split('\n'),pageWarnings);
    if(nodes.some(n=>n.type==='column'))nodes=[{type:'block',kind:'columns',options:['two'],children:nodes}];
    const html=renderNodes(nodes,{accent},pageWarnings);
    warnings.push(...pageWarnings.map(w=>`Page ${index+1}: ${w}`));
    return {html,background,accent,size,sectionStart,width:size==='letter'?1056:960,number:(doc.pageStart||1)+index};
  });
  return {pages,warnings:[...new Set(warnings)]};
}
