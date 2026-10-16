import {renderDocument} from './renderer.js';
import {PALETTE} from './documentFormat.js';
import {applyDocumentStyle} from './workspace.js';

export function createSnippetPreview(host,getDocument,getAccent){
  const root=host.attachShadow({mode:'open'});
  root.innerHTML=`<link rel="stylesheet" href="document.css"><style>
    :host{display:block;min-width:0;color:#344737;font:12px/1.5 'Segoe UI',sans-serif}
    *{box-sizing:border-box}#label{font:600 14px 'Segoe UI',sans-serif;margin:0 0 5px}#detail{margin:0 0 12px;color:#72806b}
    #pages{overflow:auto;max-height:440px;border:1px solid #d5dbcd;border-radius:6px;background:white;padding:14px}
    .sheet{width:100%;height:auto;min-height:70px;padding:0;overflow:visible;font-size:11px}
    .sheet::before,.sheet::after{display:none}.page-content{height:auto}
    .sheet .columns{gap:12px}.sheet h1{font-size:30px}.sheet h2{font-size:23px}.sheet h3{font-family:Teko;font-size:20px}
    .sheet .flavor{font-size:21px}.sheet .box .columns{gap:8px}
    @media(max-width:600px){#pages{max-height:185px}}
  </style><h3 id="label">Snippet preview</h3><p id="detail">Hover over an option, or focus it with the keyboard.</p><div id="pages" hidden></div>`;
  const custom=document.createElement('style');root.append(custom);
  return {
    clear(){root.getElementById('label').textContent='Snippet preview';root.getElementById('detail').textContent='Hover over an option, or focus it with the keyboard.';root.getElementById('pages').hidden=true;root.getElementById('pages').replaceChildren();},
    show(item){
      root.getElementById('pages').innerHTML='<article class="sheet"><div class="page-content"></div></article>';
      const doc=getDocument();const accent=getAccent();const palette=PALETTE[accent];
      root.getElementById('label').textContent=item.label;
      root.getElementById('detail').textContent='Preview · click the option to insert';
      root.querySelector('.sheet').style.cssText=`--accent:${palette.hex};--tint:${palette.tint};--border:${palette.hex}`;
      root.querySelector('.page-content').innerHTML=renderDocument({...doc,accent,text:item.text}).pages[0].html;
      applyDocumentStyle(doc.style||'',custom);
      root.getElementById('pages').hidden=false;
      root.getElementById('pages').scrollTop=0;
    }
  };
}
