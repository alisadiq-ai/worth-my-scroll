import {test} from 'node:test';import assert from 'node:assert/strict';
test('worker protects credentials, deduplicates requests, caches, budgets and pauses',async()=>{
 const local:Record<string,any>={},session:Record<string,any>={};let listener:any;const accesses:string[]=[];const opened:string[]=[];
 function area(data:Record<string,any>){return {get:async(key:string)=>({[key]:data[key]}),set:async(v:any)=>Object.assign(data,structuredClone(v)),remove:async(key:string)=>{delete data[key];},setAccessLevel:async(v:any)=>{accesses.push(v.accessLevel);}};}
 (globalThis as any).chrome={tabs:{create:async({url}:{url:string})=>{opened.push(url);}},storage:{local:area(local),session:area(session)},runtime:{id:'test',getURL:(p:string)=>`chrome-extension://test/${p}`,onMessage:{addListener:(fn:any)=>listener=fn},onInstalled:{addListener:()=>{}}}};
 let calls=0;const oldFetch=globalThis.fetch;
 globalThis.fetch=async(url)=>{if(String(url).endsWith('/models'))return Response.json({data:[]});calls++;await new Promise(r=>setTimeout(r,10));return Response.json({answers:{fit:{type:'score',score:4},substance:{type:'score',score:4},value:{type:'score',score:4},slop:{type:'score',score:0},recreate:{type:'score',score:4},bait:{type:'boolean',probability:0}},usage:{inputTokens:1000,outputTokens:160}});};
 try{
  await import('../src/background');
  const own={id:'test',url:'chrome-extension://test/options.html'};const feed={id:'test',url:'https://www.linkedin.com/feed/'};
  const send=(message:any,sender=own)=>new Promise<any>(resolve=>listener(message,sender,resolve));
  assert.equal((await send({type:'SAVE_KEY',key:'vck_test-key-with-enough-characters',remember:false})).ok,true);
  assert.equal(local.gatewayKey,undefined);assert.ok(session.gatewayKey);assert.equal(accesses.length,2);
  assert.equal((await send({type:'GET_STATE'},feed)).ok,false);
  const pub=await send({type:'GET_PUBLIC'},feed);assert.equal(JSON.stringify(pub).includes('test-key'),false);
  const settings={preferences:'AI founders and real implementations',enabled:true,consent:true,dailyLimit:2};await send({type:'SAVE_SETTINGS',settings});
  const post='A concrete product release with benchmarks and honest tradeoffs.';
  const [a,b]=await Promise.all([send({type:'EVALUATE',post},feed),send({type:'EVALUATE',post},feed)]);assert.equal(a.ok,true);assert.equal(b.ok,true);assert.equal(calls,1);
  assert.equal((await send({type:'EVALUATE',post},feed)).data.cached,true);assert.equal(calls,1);
  await send({type:'SAVE_SETTINGS',settings:{...settings,preferences:'Gardening and outdoor projects'}});
  await send({type:'EVALUATE',post},feed);assert.equal(calls,2);
  const limited=await send({type:'EVALUATE',post:post+' A different post.'},feed);assert.match(limited.error,/Daily request limit/);assert.equal(calls,2);
  const failedState=await send({type:'GET_STATE'});assert.match(failedState.data.feedError.message,/Daily request limit/);
  const revisionBefore=(await send({type:'GET_PUBLIC'},feed)).data.revision;
  await send({type:'TEST_KEY'});
  const revisionAfter=(await send({type:'GET_PUBLIC',health:{version:'0.2.1',scored:2,pending:0,errors:0,detected:5}},feed)).data.revision;
  assert.ok(revisionAfter>revisionBefore);const healthy=await send({type:'GET_STATE'});assert.equal(healthy.data.feedError,undefined);assert.equal(healthy.data.feedHealth.scored,2);assert.equal(healthy.data.feedHealth.version,'0.2.1');
  await send({type:'SAVE_SETTINGS',settings:{...settings,enabled:false}});assert.equal((await send({type:'EVALUATE',post},feed)).ok,false);
  const handoff=await send({type:'OPEN_STASH',url:'https://lnkd.in/p/dwbZVKeC',note:'Recreate potential: 70/100'},feed);assert.equal(handoff.ok,true);assert.equal(opened.length,1);const target=new URL(opened[0]);assert.equal(target.origin,'https://www.favstash.app');assert.equal(target.pathname,'/dashboard/stash');assert.equal(target.searchParams.get('url'),'https://lnkd.in/p/dwbZVKeC');assert.equal(target.searchParams.get('note'),'Recreate potential: 70/100');assert.equal(target.hash,'');assert.equal(session.handoffs,undefined);
  assert.equal((await send({type:'GET_HANDOFF',id:'legacy'},{id:'test',url:'https://www.favstash.app/dashboard/stash'})).ok,false);
  assert.equal((await send({type:'OPEN_STASH',url:'https://evil.test/',note:''},feed)).ok,false);assert.equal(opened.length,1);
  const beforeRetry=(await send({type:'GET_PUBLIC'},feed)).data.revision;const callsBeforeRetry=calls;assert.equal((await send({type:'RETRY_SCORING'},feed)).ok,false);assert.equal((await send({type:'RETRY_SCORING'})).ok,true);assert.ok((await send({type:'GET_PUBLIC'},feed)).data.revision>beforeRetry);assert.equal(calls,callsBeforeRetry,'retrying feed does not spend a connection-test request');
  assert.equal((await send({type:'REMOVE_KEY'})).ok,true);assert.equal(session.gatewayKey,undefined);
 }finally{globalThis.fetch=oldFetch;}
});
