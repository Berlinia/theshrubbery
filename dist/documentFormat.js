import yaml from './vendor/yaml.js';
export const BACKGROUNDS = ['canopy','reach','plain'];
export const PALETTE = {
  willow: {name:'Willow', hex:'#95AD72', tint:'#eaf0e3'},
  olive: {name:'Grayish Olive', hex:'#83946A', tint:'#e6eadd'},
  malachite: {name:'Malachite', hex:'#149265', tint:'#d0e9df'},
  blue: {name:'Antwerp Blue', hex:'#175D7E', tint:'#d1dfe5'},
  mustard: {name:'Mustard', hex:'#ECAC42', tint:'#fbefd9'},
  raspberry: {name:'Raspberry', hex:'#A95C8D', tint:'#eedee8'},
  red: {name:'Strong Red', hex:'#BB434E', tint:'#f1d9dc'},
  black: {name:'Ink', hex:'#2d2b2c', tint:'#e5e4e4'}
};
export const emptyDocument = (text = '# A new voyage\n\nBegin somewhere in the rustling waves.\n') => ({
  title:'Untitled voyage', author:'', description:'', tags:'', language:'', style:'', snippets:'', text, theme:'Wildsea', renderer:'V3', background:'canopy', accent:'black', pageStart:1
});
export function serializeDocument(doc) {
  const metadata = Object.fromEntries(['title','author','description','tags','language','style','snippets','theme','renderer','background','accent','pageStart'].map(k=>[k,doc[k] ?? emptyDocument()[k]]));
  return '```metadata\n' + yaml.dump(metadata, {lineWidth:-1}) + '```\n\n' + doc.text;
}
export function parseDocument(source) {
  if (typeof source !== 'string' || source.length > 2000000) throw new Error('Please open a Markdown document smaller than 2 MB.');
  let text = source.replace(/^\uFEFF/,'').replace(/\r\n?/g,'\n');
  const doc = emptyDocument('');
  if (text.startsWith('```metadata\n')) {
    const end = text.indexOf('\n```',12);
    if(end < 0) throw new Error('The metadata block is missing its closing fence.');
    const meta = yaml.load(text.slice(12,end),{schema:yaml.JSON_SCHEMA});
    if(!meta || typeof meta !== 'object' || Array.isArray(meta)) throw new Error('Invalid document metadata.');
    for(const key of ['title','author','description','tags','language','style','snippets','background','accent','pageStart']) if(Object.hasOwn(meta,key)) doc[key]=meta[key];
    text=text.slice(end+4).replace(/^\n{1,2}/,'');
  } else {
    doc.title = text.match(/^#\s+(.+)$/m)?.[1] || 'Imported voyage';
  }
  if(typeof doc.title !== 'string') throw new Error('The document title must be text.');
  if(typeof doc.author !== 'string') throw new Error('The author or publisher must be text.');
  for(const key of ['description','tags','language','style','snippets']) if(typeof doc[key] !== 'string') throw new Error('The '+key+' field must be text.');
  if(!BACKGROUNDS.includes(doc.background)) doc.background='canopy';
  if(!Object.hasOwn(PALETTE,doc.accent)) doc.accent='black';
  doc.pageStart = Number.isInteger(doc.pageStart) && doc.pageStart > 0 ? doc.pageStart : 1;
  doc.text=text;
  return doc;
}
