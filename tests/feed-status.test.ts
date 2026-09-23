import {test} from 'node:test';import assert from 'node:assert/strict';import {feedStatus} from '../src/feed-status';
test('popup reports observed feed health instead of the enabled toggle',()=>{
 const now=100000;const state={hasKey:true,settings:{enabled:true,consent:true},feedHealth:{at:now,scored:3,pending:0,errors:0,retrying:0}};
 assert.equal(feedStatus({...state,feedHealth:undefined},now).label,'Waiting for LinkedIn');
 assert.equal(feedStatus({...state,feedHealth:{...state.feedHealth,at:0}},now).tone,'idle');
 assert.equal(feedStatus({...state,hasKey:false},now).label,'Connect Jev to score');
 assert.equal(feedStatus({...state,settings:{enabled:true,consent:false}},now).label,'Scoring is paused');
 assert.equal(feedStatus(state,now).label,'Feed is up to date');
 assert.equal(feedStatus({...state,feedHealth:{...state.feedHealth,pending:1}},now).label,'Scoring posts…');
 assert.equal(feedStatus({...state,feedHealth:{...state.feedHealth,retrying:1}},now).label,'Waiting to retry');
 const failed=feedStatus({...state,feedHealth:{...state.feedHealth,errors:1},feedError:{message:'Gateway credits required'}},now);
 assert.equal(failed.label,'Scoring needs attention');assert.equal(failed.retry,true);assert.equal(failed.detail,'Gateway credits required');
});
