import {resolveProvider,type Provider} from './provider';
import {EvaluationError,BASE_PRICING,DEFAULT_SETTINGS,MODEL,cacheKey,evaluate,type Settings,type Verdict,type Pricing} from './core';
import {stashSaveUrl} from './favstash';
type Usage={day:string;attempts:number;count:number;input:number;output:number;ms:number;estimatedSpend:number};
type Cache=Record<string,{at:number;verdict:Verdict}>;
const ready=Promise.all([chrome.storage.local.setAccessLevel({accessLevel:'TRUSTED_CONTEXTS'}),chrome.storage.session.setAccessLevel({accessLevel:'TRUSTED_CONTEXTS'})]);
const freshUsage=():Usage=>({day:new Date().toISOString().slice(0,10),attempts:0,count:0,input:0,output:0,ms:0,estimatedSpend:0});
let lock:Promise<unknown>=Promise.resolve();
function exclusive<T>(fn:()=>Promise<T>):Promise<T>{const next=lock.then(fn);lock=next.catch(()=>{});return next;}
async function settings():Promise<Settings>{return {...DEFAULT_SETTINGS,...(await chrome.storage.local.get<{settings?:Settings}>('settings')).settings};}
async function getKey():Promise<string|undefined>{const s=await chrome.storage.session.get<{gatewayKey?:string}>('gatewayKey');if(s.gatewayKey)return s.gatewayKey;return (await chrome.storage.local.get<{gatewayKey?:string}>('gatewayKey')).gatewayKey;}
async function provider():Promise<Provider|undefined>{const key=await getKey();if(!key)return;const {keyProvider}=await chrome.storage.local.get<{keyProvider?:Provider}>('keyProvider');return resolveProvider(key,keyProvider);}
async function revision():Promise<number>{const value=(await chrome.storage.local.get('scoringRevision')).scoringRevision;return typeof value==='number'?value:0;}
async function restartScoring(){await chrome.storage.local.set({scoringRevision:Math.max(Date.now(),await revision()+1)});await chrome.storage.session.remove('feedError');}
async function usage():Promise<Usage>{return (await chrome.storage.local.get<{usage?:Usage}>('usage')).usage||freshUsage();}
async function pricing():Promise<Pricing>{if(await provider()==='typesafe')return BASE_PRICING;return (await chrome.storage.local.get<{pricing?:Pricing}>('pricing')).pricing||BASE_PRICING;}
async function refreshPricing(){if(await provider()==='typesafe')return;try{const r=await fetch('https://ai-gateway.vercel.sh/v1/models',{signal:AbortSignal.timeout(7000),redirect:'error'});if(!r.ok)return;const model=(await r.json()).data?.find((m:any)=>m.id===MODEL);const input=Number(model?.pricing?.input),output=Number(model?.pricing?.output);if(Number.isFinite(input)&&Number.isFinite(output)&&input>=0&&output>=0)await chrome.storage.local.set({pricing:{input,output,checkedAt:Date.now(),source:'catalog'}});}catch{/* keep dated snapshot */}}
let active=0;
const pending=new Map<string,Promise<Verdict>>();
const waiters:Array<()=>void>=[];
let blockedUntil=0;
async function score(post:unknown):Promise<Verdict>{
 const s=await settings();if(!s.enabled||!s.consent)throw new Error('Enable scoring in the extension first.');
 if(typeof post!=='string'||post.length<20||post.length>12000)throw new Error('Only 20–12,000 characters of visible post text are accepted.');
 const key=await getKey();if(!key)throw new Error('Add your Jev or Vercel AI Gateway key in the extension.');
 const selectedProvider=await provider();
 const hash=await cacheKey(post,s.preferences,selectedProvider);
 const cached:Cache=(await chrome.storage.local.get<{cache?:Cache}>('cache')).cache||{};
 if(cached[hash]&&Date.now()-cached[hash].at<7*86400000)return {...cached[hash].verdict,cached:true};
 if(pending.has(hash))return pending.get(hash)!;
 if(pending.size>=20)throw new Error('Scoring queue is full. Scroll a little slower.');
 const task=(async()=>{
  if(active>=2)await new Promise<void>(resolve=>waiters.push(resolve));else active++;
  try{
   const latest=await settings();
   if(!latest.enabled||!latest.consent||latest.preferences!==s.preferences||await getKey()!==key)throw new Error('Preferences changed or scoring paused.');
   if(Date.now()<blockedUntil)throw new EvaluationError('Jev cooling down after a temporary error.',true);
   await exclusive(async()=>{const u=await usage();const day=freshUsage().day;if(u.day!==day){u.day=day;u.attempts=0;}if(u.attempts>=latest.dailyLimit)throw new Error('Daily request limit reached. Adjust it in settings.');u.attempts++;await chrome.storage.local.set({usage:u});});
   let verdict:Verdict;
   try{verdict=await evaluate(post,s.preferences,key,selectedProvider);}catch(e){if(e instanceof EvaluationError&&e.retryable)blockedUntil=Date.now()+60000;throw e;}
   await exclusive(async()=>{const u=await usage();const p=await pricing();u.count++;u.input+=verdict.inputTokens;u.output+=verdict.outputTokens;u.ms+=verdict.ms;u.estimatedSpend+=verdict.inputTokens*p.input+verdict.outputTokens*p.output;const c:Cache=(await chrome.storage.local.get<{cache?:Cache}>('cache')).cache||{};c[hash]={at:Date.now(),verdict};const entries=Object.entries(c).sort((a,b)=>b[1].at-a[1].at).slice(0,500);await chrome.storage.local.set({usage:u,cache:Object.fromEntries(entries)});});
   return verdict;
  }finally{const next=waiters.shift();if(next)next();else active--;}
 })();pending.set(hash,task);
 try{return await task;}finally{pending.delete(hash);}
}
const publicTypes=new Set(['GET_PUBLIC','EVALUATE','OPEN_STASH']);
async function handle(message:any,sender:chrome.runtime.MessageSender){
 await ready;
 if(sender.id!==chrome.runtime.id)throw new Error('Unknown extension sender.');
 const own=sender.url?.startsWith(chrome.runtime.getURL(''))&&!sender.tab;
 const extensionPage=sender.url?.startsWith(chrome.runtime.getURL(''));
 let linkedIn=false;try{const u=new URL(sender.url||'');linkedIn=u.origin==='https://www.linkedin.com'&&u.pathname.startsWith('/feed');}catch{}
 if(!extensionPage&&(!linkedIn||!publicTypes.has(message?.type)))throw new Error('Request not allowed.');
 if(message?.type==='GET_PUBLIC'){
  if(linkedIn&&message.health){const h=message.health;const count=(n:unknown)=>typeof n==='number'&&Number.isInteger(n)&&n>=0?Math.min(n,10000):0;await chrome.storage.session.set({feedHealth:{at:Date.now(),version:typeof h.version==='string'?h.version.slice(0,20):'',scored:count(h.scored),pending:count(h.pending),errors:count(h.errors),detected:count(h.detected),retrying:count(h.retrying)}});}
  const s=await settings();return {enabled:s.enabled&&s.consent&&!!await getKey(),preferences:s.preferences,revision:await revision()};
 }

 if(message?.type==='EVALUATE'){try{return await score(message.post);}catch(e){await chrome.storage.session.set({feedError:{at:Date.now(),message:e instanceof Error?e.message:'Scoring failed.'}});throw e;}}
 if(message?.type==='OPEN_STASH'){
  await chrome.tabs.create({url:stashSaveUrl(message.url,message.note)});return {opened:true};
 }
 if(!extensionPage&&!own)throw new Error('Open the extension to change settings.');
 switch(message?.type){
  case 'GET_STATE':return {feedHealth:(await chrome.storage.session.get('feedHealth')).feedHealth,feedError:(await chrome.storage.session.get('feedError')).feedError,provider:await provider(),settings:await settings(),hasKey:!!await getKey(),remembered:!!(await chrome.storage.local.get('gatewayKey')).gatewayKey,usage:await usage(),pricing:await pricing()};
  case 'SAVE_SETTINGS':{
   const input=message.settings;
   if(typeof input?.preferences!=='string'||input.preferences.trim().length<10||input.preferences.length>3000)throw new Error('Write 10–3,000 characters of preferences.');
   if(!Number.isInteger(input.dailyLimit)||input.dailyLimit<1||input.dailyLimit>5000)throw new Error('Daily limit must be between 1 and 5,000.');
   const s:Settings={preferences:input.preferences.trim(),enabled:input.enabled===true,consent:input.consent===true,dailyLimit:input.dailyLimit};
   if(s.enabled&&(!s.consent||!await getKey()))throw new Error('Connect your key and accept the data notice first.');
   const previous=await settings();await chrome.storage.local.set({settings:s});if(s.preferences!==previous.preferences||(!previous.enabled&&s.enabled)||s.dailyLimit>previous.dailyLimit)await restartScoring();return s;
  }
  case 'SAVE_KEY':{
   if(typeof message.key!=='string'||message.key.trim().length<20||message.key.length>500||/\s/.test(message.key.trim()))throw new Error('Paste a valid Jev or Vercel AI Gateway key.');
   const selected=resolveProvider(message.key,message.provider);
   await chrome.storage.local.remove('gatewayKey');await chrome.storage.session.remove('gatewayKey');
   await chrome.storage.local.set({keyProvider:selected});
   await (message.remember?chrome.storage.local:chrome.storage.session).set({gatewayKey:message.key.trim()});blockedUntil=0;await restartScoring();void refreshPricing();return {saved:true,provider:selected};
  }
  case 'REMOVE_KEY':await chrome.storage.local.remove('gatewayKey');await chrome.storage.session.remove('gatewayKey');await chrome.storage.local.set({settings:{...await settings(),enabled:false}});return {removed:true};
  case 'RETRY_SCORING':blockedUntil=0;await restartScoring();return {restarted:true};
  case 'TEST_KEY':{const key=await getKey();if(!key)throw new Error('Add a Jev or Gateway key first.');const v=await evaluate('We shipped an AI invoice search feature. Combining exact invoice-number matching with embeddings improved our 80-query test from 61 to 74 correct results.',DEFAULT_SETTINGS.preferences,key,await provider());blockedUntil=0;await restartScoring();return v;}
  case 'CLEAR_CACHE':await exclusive(()=>chrome.storage.local.remove('cache'));return {cleared:true};
  case 'REFRESH_PRICE':await refreshPricing();return pricing();
  default:throw new Error('Unsupported action.');
 }
}
chrome.runtime.onMessage.addListener((message,sender,respond)=>{handle(message,sender).then(data=>respond({ok:true,data})).catch(error=>respond({ok:false,error:error instanceof Error?error.message:'Something went wrong.',retryAt:error instanceof EvaluationError&&error.retryable?Math.max(blockedUntil,Date.now()+60000):undefined}));return true;});
chrome.runtime.onInstalled.addListener(()=>{void ready.then(async()=>{if(!(await chrome.storage.local.get<{settings?:Settings}>('settings')).settings)await chrome.storage.local.set({settings:DEFAULT_SETTINGS});void refreshPricing();});});
