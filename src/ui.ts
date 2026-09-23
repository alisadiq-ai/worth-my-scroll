import {detectProvider,PROVIDERS,type Provider} from './provider';
import {BASE_PRICING,DEFAULT_SETTINGS,DEFAULT_PREFERENCES,perThousand,summarize,type Settings,type Pricing,type Verdict} from './core';
import {fixtures} from './fixtures';import {mountBadge} from './badge';
const isExtension=!!globalThis.chrome?.runtime?.id;
const mode=document.body.dataset.page||'options';
const $=<T extends HTMLElement=HTMLElement>(id:string)=>document.getElementById(id) as T;
let state:any={settings:{...DEFAULT_SETTINGS},hasKey:false,usage:{count:0,input:0,output:0,ms:0,estimatedSpend:0},pricing:BASE_PRICING};
const chatPrompt='Help me write a concise LinkedIn feed preference profile (under 1,500 characters). Ask me about my work, what I am building, topics I want to learn, people I want to connect with, and content I want less of. Then write one plain-text paragraph I can paste into Worth My Scroll. Do not guess my interests.';
async function rpc(type:string,extra:any={}){if(!isExtension)throw new Error('This is the local preview. Load the extension to connect Jev.');const r=await chrome.runtime.sendMessage({type,...extra});if(!r?.ok)throw new Error(r?.error||'Extension did not respond.');return r.data;}
function toast(text:string,error=false){const el=$('toast');el.textContent=text;el.classList.toggle('error',error);el.classList.add('show');setTimeout(()=>el.classList.remove('show'),6500);}
function bind(id:string,fn:()=>Promise<void>|void){$(id)?.addEventListener('click',async()=>{const button=$(id) as HTMLButtonElement;button.disabled=true;try{await fn();}catch(e){toast(e instanceof Error?e.message:'Something went wrong',true);}finally{button.disabled=false;}});}
async function load(){if(isExtension)state=await rpc('GET_STATE');else try{state.settings={...DEFAULT_SETTINGS,...JSON.parse(localStorage.getItem('wms-preview')||'{}')};}catch{}renderState();}
function renderState(){
 if($('preferences'))$('preferences').textContent='';
 if($('preferences'))($('preferences') as HTMLTextAreaElement).value=state.settings.preferences;
 if($('dailyLimit'))($('dailyLimit') as HTMLInputElement).value=String(state.settings.dailyLimit);
 if($('consent'))($('consent') as HTMLInputElement).checked=state.settings.consent;
 if($('enabled'))($('enabled') as HTMLInputElement).checked=state.settings.enabled;
 if($('remember'))($('remember') as HTMLInputElement).checked=state.remembered||false;
 renderFeedHealth();
 const p:Pricing=state.pricing;const u=state.usage;
 const estimate=perThousand(u.input,u.output,u.count,p);
 if($('cost'))$('cost').textContent=`$${estimate.toFixed(3)}`;
 if($('costDetail'))$('costDetail').textContent=u.count?`Based on ${u.count} scored posts · ${(u.input/u.count).toFixed(0)} input tokens/post`:'Before your first scroll: assumes 1,000 input + 160 output tokens/post';
 if($('priceDetail'))$('priceDetail').textContent=`${p.source==='catalog'?'Gateway catalog':'Price snapshot'} · ${new Date(p.checkedAt).toLocaleDateString()} · $${(p.input*1e6).toFixed(3)}/M input tokens. Estimate, not your bill; excludes credits and retries.`;
 if($('count'))$('count').textContent=String(u.count);
 if($('latency'))$('latency').textContent=u.count?`${(u.ms/u.count/1000).toFixed(2)}s`:'—';
 if($('spend'))$('spend').textContent=`$${(u.estimatedSpend||0).toFixed(4)}`;
 if($('connection')){$('connection').textContent=state.hasKey?PROVIDERS[state.provider as Provider||'gateway'].name:'No key connected';$('connection').classList.toggle('connected',state.hasKey);}
 if($('keyStatus'))$('keyStatus').textContent=state.hasKey?`A key is saved ${state.remembered?'on this device':'for this browser session'}.`:'Paste a Jev or Vercel Gateway key. Provider detected automatically.';
 if($('statusLabel'))$('statusLabel').textContent=state.settings.enabled&&state.hasKey?'Scoring is on':'Scoring is paused';
 if($('connect'))$('connect').textContent=state.hasKey?'Test & start scoring':'Connect & start scoring';
 if($('keySetup')&&state.hasKey)($('keySetup') as HTMLDetailsElement).open=false;
 if($('pause')){$('pause').textContent=state.settings.enabled?'Pause scoring':'Resume scoring';($('pause') as HTMLButtonElement).disabled=!state.hasKey;}
 if($('consentRow'))$('consentRow').hidden=state.settings.consent;
 if($('charCount'))$('charCount').textContent=`${state.settings.preferences.length}/3,000`;
}
function renderFeedHealth(){
 const el=$('feedHealth');if(!el)return;
 const h=state.feedHealth;
 if(!state.settings.enabled){el.textContent='Feed scoring is paused.';return;}
 if(!h||Date.now()-h.at>20000){el.textContent='Feed not connected. Reload the extension, then refresh LinkedIn.';return;}
 if(h.errors){el.textContent=state.feedError?.message||'Some posts could not be scored. Test the connection below to retry.';return;}
 el.textContent=h.pending?`Scoring ${h.pending} post${h.pending===1?'':'s'}…`:`LinkedIn connected · ${h.scored} annotated post${h.scored===1?'':'s'}${h.detected===0?' · waiting for feed posts':''}`;
}
const brand=`<a class="brand" href="popup.html"><span class="mark">w<span>↗</span></span><span>worth my<br><b>scroll.</b><small class="by-favstash">by FavStash</small></span></a>`;
const previewRibbon=!isExtension?'<div class="preview-ribbon">LOCAL PREVIEW · Illustrative ratings. Load the Chrome extension for live Jev scoring.</div>':'';
const nav=`<header>${brand}<nav><a href="popup.html" class="${mode==='options'?'selected':''}">Your preferences</a><a href="demo.html" class="${mode==='demo'?'selected':''}">Try the feed <span>↗</span></a></nav><span class="version">INTERNAL TEST FEED / 0.2</span></header>`;
function preferencesPanel(){return `<section class="panel"><div class="section-label">01 / TUNE YOUR SIGNAL</div><div class="panel-title"><h2>What’s worth your time?</h2><span id="charCount" class="muted"></span></div><p class="muted">Write like you’re telling a friend what you want more of. Change it for any scrolling session.</p><label class="sr-only" for="preferences">Your feed preferences</label><textarea id="preferences" maxlength="3000" rows="7" placeholder="I’m building… I want to learn… I’d like to connect with… Skip…"></textarea><div class="tip"><span>✳</span><p>Need a hand? Ask ChatGPT to write your preferences, then paste them here. <button id="copyPrompt" class="text-button">Copy a prompt ↗</button></p></div><div class="save-row"><span class="muted">Your interests. Your filter.</span><button id="savePrefs" class="primary">Save preferences <span>↗</span></button></div></section>`;}
function bindCommon(){
 bind('copyPrompt',async()=>{await navigator.clipboard.writeText(chatPrompt);toast('Prompt copied. Paste it into ChatGPT.');});
 $('preferences')?.addEventListener('input',()=>{$('charCount').textContent=`${($('preferences') as HTMLTextAreaElement).value.length}/3,000`;});
 bind('savePrefs',async()=>{await save(false);toast(isExtension?'Preferences saved. New ratings will use your updated interests.':'Preview preferences saved. Install the extension for live scoring.');});
}
async function save(all:boolean){
 const preferences=($('preferences') as HTMLTextAreaElement).value.trim();if(preferences.length<10)throw new Error('Add a little more detail to your preferences.');
 const s:Settings={...state.settings,preferences};if(all){s.enabled=($('enabled') as HTMLInputElement).checked;s.consent=($('consent') as HTMLInputElement).checked;s.dailyLimit=Number(($('dailyLimit') as HTMLInputElement).value);}
 if(isExtension)await rpc('SAVE_SETTINGS',{settings:s});else localStorage.setItem('wms-preview',JSON.stringify(s));await load();
}
function makePost(index:number){
 const f=fixtures[index];const post=document.createElement('article');post.className='post';post.dataset.index=String(index);
 const author=document.createElement('div');author.className='author';
 const avatar=document.createElement('div');avatar.className=`avatar avatar-${index}`;avatar.textContent=f.initials;
 const bio=document.createElement('div');const name=document.createElement('b');name.textContent=f.name;const role=document.createElement('span');role.textContent=f.role;const time=document.createElement('small');time.textContent=`${f.time} · Sample post`;bio.append(name,role,time);author.append(avatar,bio);
 const text=document.createElement('p');text.className='post-text';text.textContent=f.text;
 const actions=document.createElement('div');actions.className='post-actions';actions.textContent='♡  Like                 ◯  Comment                 ⇄  Repost';
 post.append(author,text,actions);return post;
}
function mountDemo(){
 document.body.innerHTML=previewRibbon+nav+`<main class="demo-main"><section class="demo-intro"><div class="eyebrow">THE TEST SCROLL / SYNTHETIC POSTS</div><h1>Your taste.<br><em>In living color.</em></h1><p>Three posts. Three different signals.<br>Try live Jev scoring, then take an idea to FavStash.</p><div class="demo-status" id="demoStatus">Illustrative ratings · no API requests yet</div></section><div class="demo-layout"><div class="feed" id="feed"></div><aside class="demo-aside">${preferencesPanel()}<section class="panel"><div class="section-label">PUT JEV TO WORK</div><p>Analyze these three sample posts using your saved preferences and Gateway key.</p><button class="primary wide" id="runLive">Score with Jev ↗</button><button class="secondary wide" id="resetDemo">Show illustrative ratings</button><p class="fine">Live mode uses the same worker, rubric, cache, and budget as your LinkedIn feed. <a href="popup.html">Connect and enable Jev first.</a></p><p class="fine">These people and posts are fictional.</p></section></aside></div><footer><span>Find it. Stash it. Make it your own.</span><span>POWERED BY JEV</span></footer></main><div id="toast" role="status" aria-live="polite"></div>`;
 for(let i=0;i<fixtures.length;i++)$('feed').append(makePost(i));showIllustrative();bindCommon();
 bind('resetDemo',()=>showIllustrative());
 bind('runLive',async()=>{await save(false);$('demoStatus').textContent='Scoring with Jev…';const posts=[...document.querySelectorAll<HTMLElement>('.post')];for(const p of posts){p.querySelector('wms-rating')?.remove();p.classList.remove('wms-rated');}let completed=0;try{for(let i=0;i<fixtures.length;i++){const v=await rpc('EVALUATE',{post:fixtures[i].text});mountBadge(posts[i],v);completed++;$('demoStatus').textContent=`Live Jev · ${completed}/3 scored${v.cached?' · cache hit':''}`;}toast('Live ratings ready. Open “Why?” on any post.');}catch(e){$('demoStatus').textContent=`Live scoring stopped · ${completed}/3 scored`;throw e;}});
}
function showIllustrative(){for(let i=0;i<fixtures.length;i++){const post=document.querySelector<HTMLElement>(`.post[data-index="${i}"]`)!;mountBadge(post,{...summarize(fixtures[i].dims),ms:0,inputTokens:0,outputTokens:0,cached:true});}$('demoStatus').textContent='Illustrative ratings · no API requests';}
function mountPopup(){
 document.body.classList.add('popup');
 document.body.innerHTML=`<div class="popup-header">${brand}<span class="small-tag">Jev inside</span></div>
 <div class="session-status"><span class="status-dot"></span><span id="statusLabel">Scoring is paused</span><button id="pause" class="text-button">Resume scoring</button></div>
 <p id="feedHealth" class="feed-health" role="status" aria-live="polite"></p><section class="popup-section"><label for="preferences" class="popup-heading">What’s worth your time?</label><p class="muted">Your interests, your people, your next idea.</p><textarea id="preferences" maxlength="3000" rows="5" placeholder="I’m building… I’d like to learn… Less of…"></textarea><div class="popup-meta"><span id="charCount"></span><button class="text-button" id="savePrefs">Save preferences</button></div><p class="prompt-tip">Let ChatGPT help you write this. <button id="copyPrompt" class="text-button">Copy prompt ↗</button></p></section>
 <details id="keySetup" class="popup-section key-setup" open><summary><span>Your connection</span><span id="connection">No key connected</span></summary><p id="keyStatus" class="muted"></p><label for="apiKey" class="sr-only">Jev or Vercel Gateway API key</label><input id="apiKey" class="key-input" type="password" autocomplete="off" spellcheck="false" placeholder="Paste Jev or Vercel Gateway key"><p id="detected" class="provider-hint">Auto-detects your provider</p><label id="providerRow" class="provider-row" hidden>Unrecognized format — choose provider<select id="provider"><option value="">Choose…</option><option value="typesafe">TypeSafe / Jev direct</option><option value="gateway">Vercel AI Gateway</option></select></label><label class="check"><input type="checkbox" id="remember">Remember key on this device</label><p class="fine">Stored in this Chrome profile, never synced or sent to us. Sent only to your selected provider for authentication. Otherwise clears when Chrome closes.</p><div class="key-links"><a href="https://console.typesafe.ai/keys" target="_blank" rel="noreferrer">Get Jev key ↗</a><a href="https://vercel.com/ai-gateway" target="_blank" rel="noreferrer">Get Gateway key ↗</a><button id="removeKey" class="text-button">Remove key</button></div></details>
 <label class="check popup-consent" id="consentRow"><input id="consent" type="checkbox"><span>Allow visible post text and my preferences to be sent to Jev, directly or through Vercel, for scoring.</span></label>
 <button id="connect" class="primary wide">Connect & start scoring</button><p id="connectResult" class="connect-result" role="status" aria-live="polite"></p>
 <details class="popup-advanced"><summary>Usage & controls <span><b id="cost">$0.042</b> / 1,000 posts</span></summary><label class="limit">Daily request limit <input id="dailyLimit" type="number" min="1" max="5000"></label><button id="saveLimit" class="text-button">Save limit</button><div class="mini-stats"><span><b id="count">0</b> scored</span><span><b id="latency">—</b> average</span><span><b id="spend">$0</b> estimated</span></div><p id="costDetail" class="fine"></p><p id="priceDetail" class="fine"></p><button id="clearCache" class="text-button">Clear cached ratings</button></details>
 <div class="popup-footer"><span>Made for your kind of interesting.</span><a href="https://www.favstash.app" target="_blank" rel="noreferrer">by FavStash ↗</a></div><div id="toast" role="status" aria-live="polite"></div>`;
 bindCommon();
 $('apiKey').addEventListener('input',()=>{const key=($('apiKey') as HTMLInputElement).value.trim();const detected=detectProvider(key);$('detected').textContent=detected?`${PROVIDERS[detected].name} detected`:key?'Choose your provider below':'Auto-detects your provider';$('providerRow').hidden=!key||!!detected;});
 bind('connect',async()=>{
  const preferences=($('preferences') as HTMLTextAreaElement).value.trim();
  const consent=($('consent') as HTMLInputElement).checked;
  const dailyLimit=Number(($('dailyLimit') as HTMLInputElement).value);
  if(preferences.length<10)throw Error('Tell us a little more about your interests first.');
  if(!consent)throw Error('Accept the scoring data notice to connect.');
  if(!Number.isInteger(dailyLimit)||dailyLimit<1||dailyLimit>5000)throw Error('Daily limit must be between 1 and 5,000.');
  const key=($('apiKey') as HTMLInputElement).value.trim();
  const result=$('connectResult');result.classList.remove('error');result.textContent='Connecting to Jev…';
  try{
   if(key){await rpc('SAVE_KEY',{key,remember:($('remember') as HTMLInputElement).checked,provider:($('provider') as HTMLSelectElement).value||undefined});($('apiKey') as HTMLInputElement).value='';}
   const v=await rpc('TEST_KEY');
   await rpc('SAVE_SETTINGS',{settings:{preferences,consent,enabled:true,dailyLimit}});
   await load();result.textContent=`Connected · ${(v.ms/1000).toFixed(2)}s. Your LinkedIn feed is ready.`;
  }catch(e){result.classList.add('error');result.textContent=(e as Error).message;throw e;}
 });
 bind('pause',async()=>{await rpc('SAVE_SETTINGS',{settings:{...state.settings,enabled:!state.settings.enabled}});await load();});
 bind('removeKey',async()=>{await rpc('REMOVE_KEY');await load();($('keySetup') as HTMLDetailsElement).open=true;$('connectResult').textContent='Key removed. Scoring paused.';});
 bind('saveLimit',async()=>{await rpc('SAVE_SETTINGS',{settings:{...state.settings,dailyLimit:Number(($('dailyLimit') as HTMLInputElement).value)}});await load();toast('Daily request limit saved.');});
 bind('clearCache',async()=>{await rpc('CLEAR_CACHE');toast('Cache cleared. Refresh LinkedIn to score again.');});
}
if(mode==='demo')mountDemo();else mountPopup();
void load().catch(e=>toast(e.message,true));

if(mode!=='demo'&&isExtension)setInterval(()=>void rpc('GET_STATE').then(next=>{state.feedHealth=next.feedHealth;state.feedError=next.feedError;renderFeedHealth();}).catch(()=>{}),3000);
