import {TEMPLATES} from './templates.js';
export const CATEGORIES = {
  tables: {label:'Tables', description:'Striped rows, reference tables, and labelled fields.'},
  columns: {label:'Columns', description:'Insert a layout at your cursor. Each section is editable Markdown.'},
  blocks: {label:'Blocks', description:'Boxes, tracks, lists, and other writing elements.'},
  pages: {label:'Templates', description:'Insert a complete, editable template after the current page. Existing content is kept.'}
};
export const SNIPPETS = {
  table:{category:'tables',label:'Striped table',detail:'Accent header · alternating rows',text:'{{table,accent=black\n| Heading | Details |\n|:---|:---|\n| First entry | Describe the entry. |\n| Second entry | Describe the entry. |\n| Third entry | Describe the entry. |\n}}\n'},
  plainTable:{category:'tables',label:'Plain table',detail:'Clean rows without shading',text:'{{table,plain,accent=black\n| Heading | Details |\n|:---|:---|\n| First entry | Describe the entry. |\n| Second entry | Describe the entry. |\n}}\n'},
  ruledTable:{category:'tables',label:'Ruled table',detail:'Fine horizontal rules between entries',text:'{{table,ruled,accent=black\n| Item | Description | Value |\n|:---|:---|:---:|\n| First | Describe the item. | 1 |\n| Second | Describe the item. | 2 |\n}}\n'},
  compactTable:{category:'tables',label:'Compact reference',detail:'Tighter spacing for dense information',text:'{{table,compact,accent=black\n| Term | Meaning |\n|:---|:---|\n| First term | A short definition. |\n| Second term | A short definition. |\n| Third term | A short definition. |\n}}\n'},
  rollTable:{category:'tables',label:'Roll table',detail:'Narrow dice column · room for results',text:'{{table,roll,accent=black\n| d6 | Result |\n|:---:|:---|\n| 1–2 | Describe the first outcome. |\n| 3–4 | Describe the second outcome. |\n| 5–6 | Describe the third outcome. |\n}}\n'},
  fields:{category:'tables',label:'Striped fields',detail:'Headerless entries · one source line per row',text:'{{fields,accent=black\n**Label:** Describe the first entry.\n**Label:** Describe the second entry.\n**Label:** Describe the third entry.\n}}\n'},
  npcFields:{category:'tables',label:'Character / NPC fields',detail:'Essentials, specialties, attitude, appearance',text:'{{fields,accent=black\n**Essentials:** Name, pronouns, bloodline, and role.\n**Specialties:** What this person knows or can do.\n**Attitude:** How they respond to others.\n**Appearance:** A memorable visual detail.\n}}\n'},
  boxedTable:{category:'tables',label:'Enclosed roll table',detail:'A heading and striped results inside a box',text:'{{box,accent=black\n### Table name {{accent (d6)}}\nIntroduce when to use this table.\n\n{{table,roll,accent=black\n| d6 | Result |\n|:---:|:---|\n| 1–2 | First outcome. |\n| 3–4 | Second outcome. |\n| 5–6 | Third outcome. |\n}}\n}}\n'},
  columns:{category:'columns',label:'Two equal columns',detail:'½ + ½',text:'{{columns,two\n## Left column\nWrite here.\n\n\\column\n\n## Right column\nWrite here.\n}}\n'},
  three:{category:'columns',label:'Three equal columns',detail:'⅓ + ⅓ + ⅓',text:'{{columns,three\n### First column\nWrite here.\n\n\\column\n\n### Second column\nWrite here.\n\n\\column\n\n### Third column\nWrite here.\n}}\n'},
  split:{category:'columns',label:'Wide left, narrow right',detail:'⅔ + ⅓ · main text and sidebar',text:'{{columns,two-one\n## Main section\nWrite your main text here.\n\n\\column\n\n{{box,accent=black\n### Sidebar\nWrite an aside here.\n}}\n}}\n'},
  reverseSplit:{category:'columns',label:'Narrow left, wide right',detail:'⅓ + ⅔ · sidebar and main text',text:'{{columns,one-two\n{{box,accent=black\n### Sidebar\nWrite an aside here.\n}}\n\n\\column\n\n## Main section\nWrite your main text here.\n}}\n'},
  nestedColumns:{category:'columns',label:'Two columns + sidebar',detail:'Tigers-style layout with a shared wide section',text:'{{columns,two-one\n## Shared heading\nThis introduction spans the first two columns.\n\n{{columns,two\n### First section\nWrite here.\n\n\\column\n\n### Second section\nWrite here.\n}}\n\n### Shared section below\nThis text also spans the first two columns.\n\n\\column\n\n## Sidebar\nThis column runs alongside the other two.\n}}\n'},
  box:{category:'blocks',label:'Enclosed box',detail:'Explicit black accent · edit the color in Markdown',text:'{{box,accent=black\n### A heading {{accent (Subtitle)}}\nWrite your boxed text here.\n}}\n'},
  note:{category:'blocks',label:'Firefly note',detail:'A boxed aside with a prompt list',text:'{{note,accent=black\n### Firefly guidance\nExplain when to use this guidance.\n\n- A question to ask.\n- A detail to emphasize.\n- A consequence to consider.\n}}\n'},
  track:{category:'blocks',label:'Track with breaks',detail:'3|2|5 → ten connected circles',text:'**Track:** {{track 3|2|5}}\n'},
  list:{category:'blocks',label:'Leaf bullet list',detail:'The supplied Wildsea bullet',text:'- First point.\n- Second point.\n- Third point.\n'},
  flavor:{category:'blocks',label:'Flavour quotation',detail:'Prominent text with an attribution',text:'{{flavor,accent=black\nWrite a short quotation or aside.\n\n— Attribution\n}}\n'},
  subtitle:{category:'blocks',label:'Heading with subtitle',detail:'Accent text inherits the page colour',text:'### Heading {{accent (Subtitle)}}\n\nWrite your paragraph here.\n'},
  page:{category:'pages',label:'Blank page',detail:'10 × 8.5 in · starts a red section',text:'# PAGE TITLE\n\nBegin writing here.\n'},
  ...Object.fromEntries(Object.entries(TEMPLATES).map(([key,value])=>[key,{category:'pages',...value}]))
};

// Each template starts an independent red section; later pages inherit it.
for (const item of Object.values(SNIPPETS)) {
  if (item.category !== 'pages') continue;
  item.text = /^\{\{page\s/.test(item.text)
    ? item.text.replace(/^(\{\{page\s+)([^\n{}]*)(\}\})/, (_, open, settings, close) =>
      open + settings.trim().split(/[,\s]+/).filter(s => !/^(header|accent)=/.test(s)).join(' ') + ' header=true accent=red' + close)
    : '{{page header=true accent=red}}\n' + item.text;
}
