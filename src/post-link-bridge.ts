// Runs in the page's MAIN world. It captures only a freshly generated LinkedIn
// permalink during the user's Save action. Never reads the existing clipboard,
// cookies, React state, network traffic, or extension credentials.
import {canonicalPostUrl} from './favstash';
const REQUEST='wms:resolve-post-link', RESULT='wms:post-link-result';
let active=false;
const visible=(el:Element)=>el.getClientRects().length>0&&getComputedStyle(el).visibility!=='hidden';

function captureCopiedLink(onLink:(url:string)=>void){
 const clipboard=navigator.clipboard;
 const own=clipboard&&Object.getOwnPropertyDescriptor(clipboard,'writeText');
 const original=clipboard?.writeText;
 let wrapper:typeof original;
 const accept=(value:unknown)=>{if(typeof value==='string'){const url=canonicalPostUrl(value.trim());if(url)onLink(url);}};
 if(clipboard&&original){
  wrapper=function(value:string){accept(value);return original.call(clipboard,value);};
  try{Object.defineProperty(clipboard,'writeText',{configurable:true,writable:true,value:wrapper});}catch{/* legacy copy event may still work */}
 }
 const onCopy=(event:ClipboardEvent)=>{
  accept(event.clipboardData?.getData('text/plain'));
  const field=document.activeElement;
  if(field instanceof HTMLInputElement||field instanceof HTMLTextAreaElement)accept(field.value.slice(field.selectionStart||0,field.selectionEnd??field.value.length));
  accept(document.getSelection()?.toString());
 };
 document.addEventListener('copy',onCopy,true);document.addEventListener('copy',onCopy);
 return ()=>{
  document.removeEventListener('copy',onCopy,true);document.removeEventListener('copy',onCopy);
  if(clipboard&&wrapper&&clipboard.writeText===wrapper){if(own)Object.defineProperty(clipboard,'writeText',own);else delete (clipboard as any).writeText;}
 };
}

window.addEventListener('message',event=>{
 if(event.source!==window||event.origin!==location.origin||event.data?.type!==REQUEST||active)return;
 const id=event.data.id;if(typeof id!=='string'||! /^[a-f0-9-]{36}$/.test(id))return;
 const post=document.querySelector<HTMLElement>(`[data-wms-link-request="${id}"]`);if(!post)return;
 const control=[...post.querySelectorAll<HTMLButtonElement>('button[aria-label]')].find(b=>/^(Open control menu for post|Open control menu|Kontrollmenü für Beitrag)/i.test(b.getAttribute('aria-label')||''));
 const reply=(url:string|null)=>window.postMessage({type:RESULT,id,url},location.origin);
 if(!control){reply(null);return;}
 active=true;let done=false;let capture:()=>void=()=>{};
 const finish=(url:string|null)=>{if(done)return;done=true;clearTimeout(timeout);observer.disconnect();capture();active=false;reply(url);};
 const copyLabel=/^(Copy link to post|Copy link|Link zum Beitrag kopieren|Link kopieren)$/i;
 let clicked=false;
 const inspect=()=>{
  if(clicked||done)return;
  const items=[...document.querySelectorAll<HTMLElement>('[role="menuitem"]')].filter(el=>visible(el)&&copyLabel.test(el.textContent?.trim()||''));
  if(items.length!==1)return;
  clicked=true;observer.disconnect();capture=captureCopiedLink(url=>finish(url));items[0].click();
 };
 const observer=new MutationObserver(inspect);
 const timeout=setTimeout(()=>{if(!clicked&&control.getAttribute('aria-expanded')==='true')control.click();finish(null);},4000);
 observer.observe(document.body,{childList:true,subtree:true});
 control.click();inspect();
});
