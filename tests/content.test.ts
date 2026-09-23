import {test} from 'node:test';
import assert from 'node:assert/strict';
import {build} from 'esbuild';
import {JSDOM} from 'jsdom';

test('visible feed recovers after connection test and restores removed annotations',async()=>{
 const bundle=await build({entryPoints:['src/content.ts'],bundle:true,format:'iife',write:false,platform:'browser'});
 const dom=new JSDOM('<head></head><body><article role="listitem" componentkey="update-card-test"><p data-testid="expandable-text-box">We shipped a useful AI feature with benchmark results and implementation details.</p></article></body>',{url:'https://www.linkedin.com/feed/',runScripts:'outside-only',pretendToBeVisual:true});
 const w=dom.window as any;const polls:Array<()=>void>=[];let revision=1,calls=0;let shouldFail=true;
 w.setInterval=(callback:()=>void)=>{polls.push(callback);return 1;};
 w.FontFace=class {load(){return Promise.reject(new Error('Font unavailable in test'));}};
 w.IntersectionObserver=class {constructor(private callback:any){}observe(target:any){queueMicrotask(()=>this.callback([{target,isIntersecting:true}]));}unobserve(){}};
 w.chrome={runtime:{id:'test',getManifest:()=>({version:'0.2.1'}),getURL:(p:string)=>p,sendMessage:async(m:any)=>{
  if(m.type==='GET_PUBLIC')return {ok:true,data:{enabled:true,preferences:'AI founders and builders',revision}};
  calls++;if(shouldFail)return {ok:false,error:'Gateway rate limit reached.'};
  return {ok:true,data:{fit:80,substance:75,value:70,slop:10,bait:5,recreate:20,score:75,tone:'green',label:'Worth your time',reasons:['Strong match'],ms:300,inputTokens:1000,outputTokens:89}};
 }},storage:{onChanged:{addListener:()=>{}}}};
 const until=async(fn:()=>boolean)=>{for(let i=0;i<50;i++){if(fn())return;await new Promise(r=>setTimeout(r,40));}throw Error('Content-script condition timed out');};
 try{
  w.eval(bundle.outputFiles[0].text);await until(()=>calls===1);await new Promise(r=>setTimeout(r,220));assert.equal(w.document.querySelectorAll('wms-rating').length,0);
  polls.forEach(fn=>fn());await new Promise(r=>setTimeout(r,220));assert.equal(calls,1,'failed posts do not loop paid requests');
  shouldFail=false;revision++;polls.forEach(fn=>fn());await until(()=>w.document.querySelectorAll('wms-rating').length===1);assert.equal(calls,2);assert.equal(w.document.documentElement.dataset.wmsVersion,'0.2.1');
  w.document.querySelector('wms-rating').remove();await until(()=>w.document.querySelectorAll('wms-rating').length===1);assert.equal(calls,3,'request restored; worker supplies cached result');
 }finally{dom.window.close();}
});
