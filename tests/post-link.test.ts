import {test} from 'node:test';import assert from 'node:assert/strict';import {build} from 'esbuild';import {JSDOM} from 'jsdom';

for(const copyMode of ['full','short','toast'] as const)test(`native copy-link bridge resolves ${copyMode} URLs and restores the clipboard method`,async()=>{
 const bundle=await build({entryPoints:['src/post-link-bridge.ts'],bundle:true,format:'iife',write:false});
 const dom=new JSDOM('<article><button aria-label="Open control menu for post by Sample">Menu</button></article>',{url:'https://www.linkedin.com/feed/',runScripts:'outside-only'});const w=dom.window as any;const writes:string[]=[];const original=async(text:string)=>{writes.push(text);};
 Object.defineProperty(w.navigator,'clipboard',{value:{writeText:original}});
 w.HTMLElement.prototype.getClientRects=()=>[{width:20,height:20}];
 const id='12345678-1234-1234-1234-123456789abc';w.document.querySelector('article').dataset.wmsLinkRequest=id;
 w.document.querySelector('button').onclick=()=>{const item=w.document.createElement('div');item.setAttribute('role','menuitem');item.textContent='Copy link to post';item.onclick=()=>{if(copyMode==='toast'){const toast=w.document.createElement('a');toast.textContent='View post';toast.href='https://www.linkedin.com/safety/go/?url='+encodeURIComponent('https://lnkd.in/p/dwbZVKeC');w.document.body.append(toast);}else void w.navigator.clipboard.writeText(copyMode==='full'?'https://www.linkedin.com/posts/example-activity-1234567890123456789?utm_source=share':'https://lnkd.in/p/dwbZVKeC');item.remove();};w.document.body.append(item);};
 try{
  w.eval(bundle.outputFiles[0].text);
  assert.equal(w.navigator.clipboard.writeText,original,'no general clipboard interception');
  const reply=new Promise<any>(resolve=>w.addEventListener('message',(e:any)=>{if(e.data?.type==='wms:post-link-result')resolve(e.data);}));
  w.dispatchEvent(new w.MessageEvent('message',{source:w,origin:w.location.origin,data:{type:'wms:resolve-post-link',id}}));
  const data=await reply;assert.equal(data.url,copyMode==='full'?'https://www.linkedin.com/posts/example-activity-1234567890123456789':'https://lnkd.in/p/dwbZVKeC');assert.equal(data.id,id);assert.equal(writes.length,copyMode==='toast'?0:1);assert.equal(w.navigator.clipboard.writeText,original,'original behavior restored immediately');assert.equal(w.document.querySelector('[role="menuitem"]'),null);
 }finally{dom.window.close();}
});
