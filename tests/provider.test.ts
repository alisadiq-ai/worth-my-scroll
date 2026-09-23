import {test} from 'node:test';import assert from 'node:assert/strict';
import {detectProvider,resolveProvider} from '../src/provider';
import {payload,parseResponse,evaluate,cacheKey} from '../src/core';
test('detects known prefixes and never guesses a destination for unknown credentials',()=>{
 assert.equal(detectProvider(' vck_example '),'gateway');assert.equal(detectProvider('ts_example'),'typesafe');assert.equal(detectProvider('sk_unknown'),null);
 assert.throws(()=>resolveProvider('sk_unknown'),/Choose the provider/);assert.equal(resolveProvider('opaque-key','typesafe'),'typesafe');assert.equal(resolveProvider('vck_example','typesafe'),'gateway');
});
test('direct API adapter uses noul, native model and snake_case usage',()=>{
 const p=payload('A useful post','AI product builders','typesafe');assert.equal(p.model,'jev-latest');assert.equal(p.questions.bait.type,'noul');
 const answers:any=Object.fromEntries(['fit','substance','value','slop','recreate'].map(k=>[k,{type:'score',score:k==='slop'?0:3.2,confidence:.8}]));answers.bait={type:'noul',noul:.1};
 const v=parseResponse({answers,usage:{input_tokens:987,output_tokens:89}},123,'typesafe');assert.equal(v.fit,80);assert.equal(v.bait,10);assert.equal(v.inputTokens,987);assert.equal(v.confidence,80);assert.equal(v.ms,123);
 assert.throws(()=>parseResponse({answers:{...answers,bait:{type:'noul',noul:1.3}}},0,'typesafe'));
});
test('each credential is sent only to its selected endpoint; provider caches are isolated',async()=>{
 const old=globalThis.fetch;const requests:any[]=[];
 globalThis.fetch=async(url,init)=>{requests.push({url,body:JSON.parse(String(init?.body))});return new Response('',{status:401});};
 try{await assert.rejects(evaluate('A long enough post to evaluate','AI founders','ts_fake_test_credential'),/TypeSafe key/);await assert.rejects(evaluate('A long enough post to evaluate','AI founders','vck_fake_test_credential'),/Gateway key/);await assert.rejects(evaluate('A long enough post to evaluate','AI founders','unknown_credential'),/Choose the provider/);assert.equal(requests.length,2);assert.equal(requests[0].url,'https://api.typesafe.ai/v1/systemone');assert.equal(requests[0].body.questions.bait.type,'noul');assert.equal(requests[1].url,'https://ai-gateway.vercel.sh/v1/evaluate');assert.equal(requests[1].body.questions.bait.type,'boolean');assert.notEqual(await cacheKey('post','prefs','gateway'),await cacheKey('post','prefs','typesafe'));}finally{globalThis.fetch=old;}
});
