import {test} from 'node:test';import assert from 'node:assert/strict';import {build} from 'esbuild';import {JSDOM} from 'jsdom';

test('red-rated posts expose toolbar save and send the exact source to the existing handoff',async()=>{
 const result=await build({entryPoints:['src/badge.ts'],bundle:true,write:false,format:'iife',globalName:'Badge'});
 const dom=new JSDOM('<article data-urn="urn:li:activity:1234567890123456789"></article>',{url:'https://www.linkedin.com/feed/',runScripts:'outside-only'});const w=dom.window as any;const messages:any[]=[];
 const originalMatches=w.Element.prototype.matches;
 w.Element.prototype.matches=function(selector:string){return selector===':popover-open'?this.hasAttribute('data-open'):originalMatches.call(this,selector);};
 w.HTMLElement.prototype.showPopover=function(){this.setAttribute('data-open','');};w.HTMLElement.prototype.hidePopover=function(){this.removeAttribute('data-open');};
 w.chrome={runtime:{sendMessage:async(m:any)=>{messages.push(m);return {ok:true,data:{opened:true}};}}};
 try{
  w.eval(result.outputFiles[0].text+";window.Badge=Badge;");const article=w.document.querySelector('article');
  const host=w.Badge.mountBadge(article,{fit:20,substance:5,value:5,slop:95,bait:90,recreate:10,score:5,tone:'red',label:'Slop alert',reasons:['Thin substance'],ms:100,inputTokens:50,outputTokens:10});
  const root=host.shadowRoot;assert.equal(root.querySelector('.stash-actions').nextElementSibling.className,'why');
  root.querySelector('.save-stash').click();await new Promise(r=>setTimeout(r,0));
  assert.equal(messages.length,1);assert.equal(messages[0].type,'OPEN_STASH');assert.equal(messages[0].url,'https://www.linkedin.com/feed/update/urn:li:activity:1234567890123456789/');assert.match(messages[0].note,/Recreate potential: 10/);assert.equal(root.querySelector('.save-stash').textContent,'Opened ↗');
  root.querySelector('.stash-info').click();assert.ok(root.querySelector('.stash-info-panel').hasAttribute('data-open'));assert.match(root.querySelector('.stash-info-panel').textContent,/MCP/);
  article.removeAttribute('data-urn');root.querySelector('.save-stash').click();w.dispatchEvent(new w.MessageEvent('message',{source:w,origin:w.location.origin,data:{type:'wms:post-link-result',id:article.dataset.wmsLinkRequest,url:null}}));await new Promise(r=>setTimeout(r,0));assert.ok(root.querySelector('.stash-link-panel').hasAttribute('data-open'));assert.equal(messages.length,1,'a missing source must never be guessed or sent');
 }finally{dom.window.close();}
});
