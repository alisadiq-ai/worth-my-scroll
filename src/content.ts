import {POST_SELECTOR,TEXT_SELECTOR,extractPost} from './linkedin';
import {mountBadge} from './badge';
import type {Verdict} from './core';
const style=document.createElement('style');
style.textContent='.wms-rated{padding-top:42px!important;outline:1px solid var(--wms-outline)!important;outline-offset:1px;border-radius:10px!important;box-shadow:none!important}';
document.head.append(style);
for(const [file,weight] of [['sora-regular.ttf','400'],['sora-semibold.ttf','600']]){const font=new FontFace('WMS Sora',`url(${chrome.runtime.getURL('fonts/'+file)})`,{weight});void font.load().then(f=>document.fonts.add(f)).catch(()=>{});}
const version=chrome.runtime.getManifest().version;document.documentElement.dataset.wmsVersion=version;
type PostState={text:string;epoch:number;status:'pending'|'done'|'dismissed'|'error';retryAt?:number;retries?:number};
let enabled=false,preferences='',revision=0,epoch=0,busy=0;
const seen=new Map<HTMLElement,PostState>();
const visible=new Set<HTMLElement>();
const observed=new Set<HTMLElement>();
const dirty=new Set<HTMLElement>();
const layer=document.createElement('div');layer.id='wms-overlay';layer.style.cssText='position:absolute;inset:0 auto auto 0;width:0;height:0;z-index:100;pointer-events:none';document.body.append(layer);
const badges=new Map<HTMLElement,HTMLElement>();
function layoutBadges(){for(const [post,badge] of badges){if(!post.isConnected||!badge.isConnected)continue;const rect=post.getBoundingClientRect();badge.style.left=`${rect.left+scrollX}px`;badge.style.top=`${rect.top+scrollY}px`;badge.style.width=`${rect.width}px`;badge.style.visibility=rect.top<0||rect.top>innerHeight?'hidden':'visible';}}
let layoutFrame=0;
function queueLayout(){if(layoutFrame)return;layoutFrame=requestAnimationFrame(()=>{layoutFrame=0;layoutBadges();});}
addEventListener('scroll',queueLayout,{passive:true});addEventListener('resize',queueLayout);
document.addEventListener('scroll',queueLayout,{capture:true,passive:true});
async function send(message:any){const r=await chrome.runtime.sendMessage(message);if(!r?.ok)throw Object.assign(new Error(r?.error||'Extension unavailable'),{retryAt:r?.retryAt});return r.data;}
function clear(el:HTMLElement){badges.get(el)?.remove();badges.delete(el);el.classList.remove('wms-rated');el.style.removeProperty('--wms-outline');}
async function refresh(){
 try{
  const p=await send({type:'GET_PUBLIC',health:{version,scored:[...badges.values()].filter(b=>b.isConnected).length,pending:busy,errors:[...seen.entries()].filter(([el,v])=>visible.has(el)&&v.status==='error'&&!v.retryAt).length,retrying:[...seen.entries()].filter(([el,v])=>visible.has(el)&&v.status==='error'&&!!v.retryAt).length,detected:document.querySelectorAll(POST_SELECTOR).length}});
  if(p.enabled!==enabled||p.preferences!==preferences||p.revision!==revision){
   revision=p.revision;enabled=p.enabled;preferences=p.preferences;epoch++;
   for(const el of seen.keys())clear(el);seen.clear();dirty.clear();scan();
  }else schedule();
 }catch{enabled=false;for(const el of seen.keys())clear(el);}
}
async function process(el:HTMLElement){
 if(!enabled||busy>=2||!el.isConnected||!visible.has(el))return;
 const previous=seen.get(el);
 if(previous?.epoch===epoch){
  if(previous.status==='pending'||previous.status==='dismissed')return;
  if(previous.status==='done'&&!dirty.has(el)&&badges.get(el)?.isConnected)return;
  if(previous.status==='error'&&(!previous.retryAt||Date.now()<previous.retryAt))return;
 }
 dirty.delete(el);
 const text=extractPost(el);if(!text){clear(el);seen.delete(el);return;}
 if(previous?.text===text&&previous.epoch===epoch&&previous.status==='done'&&badges.get(el)?.isConnected)return;
 const currentEpoch=epoch;const retries=previous?.text===text&&previous.epoch===epoch?(previous.retries||0):0;const isRetry=previous?.status==='error';
 seen.set(el,{text,epoch,status:'pending',retries});busy++;
 try{
  const v:Verdict=await send({type:'EVALUATE',post:text});
  if(enabled&&epoch===currentEpoch&&el.isConnected&&extractPost(el)===text){
   clear(el);
   const badge=mountBadge(el,v,()=>{badges.delete(el);seen.set(el,{text,epoch,status:'dismissed'});},layer);
   badge.style.position='absolute';badge.style.pointerEvents='auto';badge.style.zIndex='1';badges.set(el,badge);
   seen.set(el,{text,epoch,status:'done'});queueLayout();
  }
 }catch(error){
  if(epoch===currentEpoch){clear(el);const attempts=retries+(isRetry?1:0);const next=(error as {retryAt?:number}).retryAt;seen.set(el,{text,epoch,status:'error',retries:attempts,retryAt:attempts<1&&typeof next==='number'&&Number.isFinite(next)?next:undefined});}
 }finally{busy--;schedule();}
}
const observer=new IntersectionObserver(entries=>{for(const entry of entries){const el=entry.target as HTMLElement;if(entry.isIntersecting)visible.add(el);else visible.delete(el);}queueLayout();schedule();},{rootMargin:'120px 0px'});
function scan(){
 for(const el of document.querySelectorAll<HTMLElement>(POST_SELECTOR)){
  if(el.parentElement?.closest(POST_SELECTOR))continue;
  if(!observed.has(el)){observed.add(el);observer.observe(el);}
 }
 for(const el of observed)if(!el.isConnected){observed.delete(el);visible.delete(el);dirty.delete(el);seen.delete(el);clear(el);observer.unobserve(el);}
 queueLayout();schedule();
}
let timer:ReturnType<typeof setTimeout>|undefined;
function schedule(){clearTimeout(timer);timer=setTimeout(()=>{if(!enabled)return;for(const el of visible){if(busy>=2)break;void process(el);}},150);}
function sourceTextRoot(target:Node):Element|null{
 const parent=target instanceof Element?target:target.parentElement;
 const root=parent?.closest(TEXT_SELECTOR);const post=root?.closest(POST_SELECTOR);
 return post&&post.querySelector(TEXT_SELECTOR)===root?root:null;
}
let mutationTimer:ReturnType<typeof setTimeout>|undefined;
new MutationObserver(records=>{
 let needsScan=false;
 for(const record of records){
  const root=sourceTextRoot(record.target);if(root){const post=root.closest<HTMLElement>(POST_SELECTOR);if(post)dirty.add(post);}
  if(record.type==='childList')for(const node of [...record.addedNodes,...record.removedNodes]){
   if(node instanceof Element&&(node.matches(POST_SELECTOR)||!!node.querySelector(POST_SELECTOR)||record.removedNodes.length>0&&node.matches('wms-rating'))){needsScan=true;break;}
  }
 }
 if(needsScan&&!mutationTimer)mutationTimer=setTimeout(()=>{mutationTimer=undefined;scan();},350);
 else if(dirty.size)schedule();
 queueLayout();
}).observe(document.body,{childList:true,subtree:true,characterData:true});
chrome.storage.onChanged.addListener((changes)=>{if(['settings','gatewayKey','scoringRevision','keyProvider'].some(key=>key in changes))void refresh();});
// Local storage is restricted to extension pages. Poll public settings as a fallback.
setInterval(()=>void refresh(),5000);
void refresh();scan();
