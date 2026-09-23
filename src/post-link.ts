import {extractPostUrl,canonicalPostUrl} from './favstash';
let resolving=false;
export async function resolvePostUrl(post:HTMLElement):Promise<string|null>{
 const direct=extractPostUrl(post);if(direct)return direct;
 if(resolving)throw Error('Another post link is opening. Please try again in a moment.');
 resolving=true;
 const id=crypto.randomUUID();post.dataset.wmsLinkRequest=id;
 try{return await new Promise<string|null>(resolve=>{
  const finish=(url:string|null)=>{clearTimeout(timer);window.removeEventListener('message',receive);resolve(url);};
  const receive=(event:MessageEvent)=>{if(event.source!==window||event.origin!==location.origin||event.data?.type!=='wms:post-link-result'||event.data.id!==id)return;finish(typeof event.data.url==='string'?canonicalPostUrl(event.data.url):null);};
  const timer=setTimeout(()=>finish(null),5000);window.addEventListener('message',receive);
  window.postMessage({type:'wms:resolve-post-link',id},location.origin);
 });}finally{delete post.dataset.wmsLinkRequest;resolving=false;}
}
