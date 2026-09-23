import type {Verdict} from './core';
import {canonicalPostUrl,extractPostUrl,recreationNote,STASH_URL} from './favstash';

export function showPanel(panel:HTMLElement,anchor:HTMLElement){
 if(panel.matches(':popover-open')){panel.hidePopover();return;}
 panel.showPopover();
 const r=anchor.getBoundingClientRect(),width=panel.getBoundingClientRect().width;
 panel.style.left=`${Math.max(10,Math.min(innerWidth-width-10,r.right-width))}px`;
 panel.style.top=`${Math.max(12,Math.min(innerHeight-panel.getBoundingClientRect().height-12,r.bottom+8))}px`;
}
export function stashActions(root:ShadowRoot,post:HTMLElement,verdict:Verdict){
 const group=document.createElement('div');group.className='stash-actions';
 const save=document.createElement('button');save.className='save-stash';save.textContent='Save to Stash';
 save.title='Open this post in FavStash, choose a collection, and save';
 const info=document.createElement('button');info.className='stash-info';info.textContent='i';info.setAttribute('aria-label','About FavStash');info.setAttribute('aria-expanded','false');
 group.append(save,info);
 const panel=document.createElement('div');panel.className='details stash-info-panel';panel.setAttribute('popover','auto');panel.setAttribute('role','dialog');panel.setAttribute('aria-label','About FavStash');
 const head=document.createElement('div');head.className='panel-head';const title=document.createElement('b');title.className='headline';title.textContent='Save now. Create when you’re ready.';
 const close=document.createElement('button');close.className='close';close.textContent='×';close.setAttribute('aria-label','Close FavStash info');close.onclick=()=>panel.hidePopover();head.append(title,close);
 const intro=document.createElement('p');intro.textContent='Keep inspiration from LinkedIn and other platforms together in one FavStash collection.';
 const steps=document.createElement('ol');
 for(const text of ['Save posts to your unified stash.','Connect your AI agent through FavStash’s MCP.','Explore your own angle, recreate at your pace, and plan your content.','Have your agent schedule approved posts to LinkedIn and your connected channels.']){const li=document.createElement('li');li.textContent=text;steps.append(li);}
 const link=document.createElement('a');link.href=STASH_URL;link.target='_blank';link.rel='noopener noreferrer';link.textContent='Explore FavStash ↗';
 panel.append(head,intro,steps,link);root.append(panel);
 info.onclick=()=>showPanel(panel,info);panel.addEventListener('toggle',()=>info.setAttribute('aria-expanded',String(panel.matches(':popover-open'))));
 const linkPanel=document.createElement('div');linkPanel.className='details stash-link-panel';linkPanel.setAttribute('popover','auto');linkPanel.setAttribute('role','dialog');linkPanel.setAttribute('aria-label','Save this post to FavStash');
 const notice=document.createElement('p');notice.className='stash-notice';notice.setAttribute('role','status');
 async function open(url:string){
  save.disabled=true;notice.textContent='';
  try{const r=await chrome.runtime.sendMessage({type:'OPEN_STASH',url,note:recreationNote(verdict)});if(!r?.ok)throw Error(r?.error||'Could not open FavStash');if(linkPanel.matches(':popover-open'))linkPanel.hidePopover();save.textContent='Opened ↗';save.title='Choose your collection and finish saving in FavStash';}
  catch(e){notice.textContent=(e as Error).message;if(!linkPanel.matches(':popover-open'))showPanel(linkPanel,save);}
  finally{save.disabled=false;}
 }
 const heading=document.createElement('b');heading.className='headline';heading.textContent='Save this post';
 const help=document.createElement('p');help.textContent='LinkedIn hasn’t exposed this post’s link. Open its ⋯ menu, choose “Copy link to post”, and paste it here.';
 const label=document.createElement('label');label.textContent='Post link';const input=document.createElement('input');input.type='url';input.placeholder='https://www.linkedin.com/posts/…';label.append(input);
 const go=document.createElement('button');go.className='save-stash';go.textContent='Continue to FavStash ↗';go.onclick=()=>{const url=canonicalPostUrl(input.value);if(!url){input.setCustomValidity('Paste a public LinkedIn post link.');input.reportValidity();return;}input.setCustomValidity('');void open(url);};input.oninput=()=>input.setCustomValidity('');
 const cancel=document.createElement('button');cancel.className='dismiss';cancel.textContent='Cancel';cancel.onclick=()=>linkPanel.hidePopover();
 linkPanel.append(heading,help,label,go,cancel,notice);root.append(linkPanel);
 if(post.dataset.index!==undefined){save.disabled=true;save.title='Sample posts have no real LinkedIn link. Try this on your feed.';}
 save.onclick=()=>{const source=extractPostUrl(post);if(source){void open(source);return;}showPanel(linkPanel,save);input.focus({preventScroll:true});};
 return group;
}
