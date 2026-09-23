import {POST_SELECTOR,extractPost} from './linkedin';
import {mountBadge} from './badge';
import type {Verdict} from './core';
const style=document.createElement('style');style.textContent='.wms-rated{outline:1px solid var(--wms-outline)!important;outline-offset:1px;border-radius:10px!important;box-shadow:none!important}';document.head.append(style);
for(const [file,weight] of [['sora-regular.ttf','400'],['sora-semibold.ttf','600']]){const font=new FontFace('WMS Sora',`url(${chrome.runtime.getURL('fonts/'+file)})`,{weight});void font.load().then(f=>document.fonts.add(f)).catch(()=>{});}
let enabled=false,preferences='',epoch=0,busy=0;
const seen=new Map<HTMLElement,{text:string;epoch:number;status:string}>();
const visible=new Set<HTMLElement>();
async function send(message:any){const r=await chrome.runtime.sendMessage(message);if(!r?.ok)throw new Error(r?.error||'Extension unavailable');return r.data;}
function clear(el:HTMLElement){el.querySelector(':scope > wms-rating')?.remove();el.classList.remove('wms-rated');el.style.removeProperty('--wms-outline');}
async function refresh(){try{const p=await send({type:'GET_PUBLIC'});if(p.enabled!==enabled||p.preferences!==preferences){enabled=p.enabled;preferences=p.preferences;epoch++;for(const el of seen.keys())clear(el);seen.clear();scan();}}catch{enabled=false;for(const el of seen.keys())clear(el);}}
async function process(el:HTMLElement){
 if(!enabled||busy>=2||!el.isConnected||!visible.has(el))return;
 const text=extractPost(el);if(!text){clear(el);seen.delete(el);return;}
 const previous=seen.get(el);if(previous?.text===text&&previous.epoch===epoch)return;
 const currentEpoch=epoch;seen.set(el,{text,epoch,status:'pending'});busy++;
 try{const v:Verdict=await send({type:'EVALUATE',post:text});if(enabled&&epoch===currentEpoch&&el.isConnected&&extractPost(el)===text){mountBadge(el,v,()=>seen.set(el,{text,epoch,status:'dismissed'}));seen.set(el,{text,epoch,status:'done'});}}
 catch{if(epoch===currentEpoch){clear(el);seen.set(el,{text,epoch,status:'error'});}}
 finally{busy--;schedule();}
}
const observer=new IntersectionObserver(entries=>{for(const entry of entries){const el=entry.target as HTMLElement;if(entry.isIntersecting)visible.add(el);else visible.delete(el);}schedule();},{rootMargin:'120px 0px'});
const observed=new WeakSet<Element>();
function scan(){
 for(const el of document.querySelectorAll<HTMLElement>(POST_SELECTOR)){
  if(el.parentElement?.closest(POST_SELECTOR))continue;
  if(!observed.has(el)){observed.add(el);observer.observe(el);}
 }
 for(const el of seen.keys())if(!el.isConnected){seen.delete(el);visible.delete(el);observer.unobserve(el);}
 for(const el of visible)if(!el.isConnected){visible.delete(el);observer.unobserve(el);}
 schedule();
}
let timer:ReturnType<typeof setTimeout>|undefined;
function schedule(){clearTimeout(timer);timer=setTimeout(()=>{if(!enabled)return;for(const el of visible){if(busy>=2)break;void process(el);}},150);}
let mutationTimer:ReturnType<typeof setTimeout>|undefined;
new MutationObserver(()=>{clearTimeout(mutationTimer);mutationTimer=setTimeout(scan,350);}).observe(document.body,{childList:true,subtree:true,characterData:true});
chrome.storage.onChanged.addListener((_changes,area)=>{if(area==='local'||area==='session')void refresh();});
// Local storage is restricted to extension pages. Poll public settings as a fallback.
setInterval(()=>void refresh(),5000);
void refresh();scan();
