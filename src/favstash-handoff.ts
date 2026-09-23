// Runs only on FavStash's stash page after an explicit extension handoff.
// Prepares its existing form; the user selects a collection and clicks Save.
export {};
const id=new URLSearchParams(location.hash.slice(1)).get('wms');
if(id&&/^[a-f0-9-]{36}$/.test(id))void prepare(id);
async function prepare(id:string){
 const result=await chrome.runtime.sendMessage({type:'GET_HANDOFF',id});if(!result?.ok||!result.data)return;
 const {url,note}=result.data;
 const host=document.createElement('div');host.style.cssText='position:fixed;bottom:24px;right:24px;z-index:2147483647;max-width:350px';const root=host.attachShadow({mode:'open'});
 const box=document.createElement('div');box.style.cssText='font:13px/1.6 Arial,sans-serif;color:#13192c;background:#f6f8fc;border:1px solid #6f96ed;border-radius:16px;padding:20px;box-shadow:0 10px 40px #3458a833';
 const title=document.createElement('b');title.textContent='An idea from Worth My Scroll ↗';const text=document.createElement('p');text.textContent='Choose a collection in FavStash and save. Your recreation brief will be included in the note.';
 const button=document.createElement('button');button.textContent='Prepare save form';button.style.cssText='background:#466fd2;color:white;padding:9px 12px;border:0;border-radius:8px;cursor:pointer';
 const close=document.createElement('button');close.textContent='Dismiss';close.style.cssText='border:0;background:none;color:#69718a;padding:10px;cursor:pointer';close.onclick=()=>host.remove();
 button.onclick=async()=>{
  const add=[...document.querySelectorAll('button')].find(b=>/^Add\s*(item|link|content|to stash)?$/i.test(b.textContent?.trim()||''));
  if(!document.querySelector('input[type="url"]'))add?.click();
  let field:HTMLInputElement|null=null;for(let i=0;i<20;i++){field=document.querySelector('input[type="url"]');if(field)break;await new Promise(r=>setTimeout(r,100));}
  if(!field){await navigator.clipboard.writeText(url);text.textContent='Link copied. Click Add in FavStash, paste it, choose a collection, and save.';return;}
  Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value')!.set!.call(field,url);field.dispatchEvent(new Event('input',{bubbles:true}));field.dispatchEvent(new Event('change',{bubbles:true}));
  const notes=document.querySelector<HTMLTextAreaElement>('textarea[placeholder="Why are you saving this?"]');if(notes){Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype,'value')!.set!.call(notes,note);notes.dispatchEvent(new Event('input',{bubbles:true}));notes.dispatchEvent(new Event('change',{bubbles:true}));}
  text.textContent='Ready. Choose your collection and click Save in FavStash. Nothing has been saved yet.';button.textContent='Prepared ✓';button.disabled=true;
 };
 box.append(title,text,button,close);root.append(box);document.body.append(host);
}
