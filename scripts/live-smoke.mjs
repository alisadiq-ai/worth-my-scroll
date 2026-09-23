// A few synthetic evaluations only. Never print or persist credentials.
import {evaluate,DEFAULT_PREFERENCES,perThousand,BASE_PRICING} from '../output/core.mjs';
import {writeFile,mkdir} from 'node:fs/promises';
const key=process.env.AI_GATEWAY_API_KEY;if(!key)throw Error('Supply AI_GATEWAY_API_KEY in the process environment.');
const cases=[
 {name:'builder',preferences:DEFAULT_PREFERENCES,post:'We shipped semantic search in our invoicing app. Embeddings missed invoice numbers, so we added an exact-match path. Correct retrieval improved from 61 to 74 queries out of 80. The tradeoff is maintaining two indexes.'},
 {name:'bait',preferences:DEFAULT_PREFERENCES,post:'Most founders are NOT ready for this AI secret. It changes everything. This is not a tool. It is a revolution. Comment AI and follow me to unlock my exclusive playbook.'},
 {name:'gardening-builder',preferences:DEFAULT_PREFERENCES,post:'My tomato seedlings developed purple leaves after a week at 8 C. Moving them indoors overnight helped; new growth turned green in six days. Next season I will track soil temperature before adding fertilizer.'},
 {name:'gardening-gardener',preferences:'Vegetable gardening, seedling care and practical growing experiments. I want concrete lessons from home gardeners.',post:'My tomato seedlings developed purple leaves after a week at 8 C. Moving them indoors overnight helped; new growth turned green in six days. Next season I will track soil temperature before adding fertilizer.'}
];
const results=[];for(const c of cases)results.push({case:c.name,...await evaluate(c.post,c.preferences,key)});
const input=results.reduce((n,r)=>n+r.inputTokens,0),output=results.reduce((n,r)=>n+r.outputTokens,0);
const report={at:new Date().toISOString(),model:'typesafe-ai/jev',synthetic:true,results,estimatedPer1000:perThousand(input,output,results.length,BASE_PRICING),note:'Smoke test only. Cost is a catalog-rate estimate, not verified billing.'};
await mkdir('output',{recursive:true});await writeFile('output/live-smoke.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
