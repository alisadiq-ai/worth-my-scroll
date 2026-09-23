import type {Verdict} from './core';
const NS='http://www.w3.org/2000/svg';
export function radar(v:Verdict){
 const axes=[['Fit',v.fit],['Substance',v.substance],['Value',v.value],['Recreate',v.recreate],['Clarity',100-v.slop],['No bait',100-v.bait]] as const;
 const svg=document.createElementNS(NS,'svg');svg.setAttribute('viewBox','0 0 280 230');svg.setAttribute('role','img');svg.setAttribute('aria-label','Signal radar. Larger shape means stronger fit, substance, value, recreation potential, clarity, and less bait.');
 const point=(i:number,r:number)=>{const a=-Math.PI/2+i*Math.PI/3;return [140+Math.cos(a)*r,112+Math.sin(a)*r];};
 function element(tag:string,attributes:Record<string,string>,text?:string){const el=document.createElementNS(NS,tag);for(const [k,v]of Object.entries(attributes))el.setAttribute(k,v);if(text)el.textContent=text;svg.append(el);return el;}
 for(const f of [.25,.5,.75,1])element('polygon',{points:axes.map((_,i)=>point(i,72*f).join(',')).join(' '),fill:'none',stroke:'#dfe5f0','stroke-width':'1'});
 for(let i=0;i<6;i++){const [x,y]=point(i,72);element('line',{x1:'140',y1:'112',x2:String(x),y2:String(y),stroke:'#dfe5f0'});}
 element('polygon',{points:axes.map(([,value],i)=>point(i,72*value/100).join(',')).join(' '),fill:'#6f96ed33',stroke:'#466fd2','stroke-width':'2','stroke-linejoin':'round'});
 axes.forEach(([name,value],i)=>{const[x,y]=point(i,72*value/100);element('circle',{cx:String(x),cy:String(y),r:'3',fill:'#466fd2',stroke:'white','stroke-width':'1.5'});const[tx,ty]=point(i,88);element('text',{x:String(tx),y:String(ty),'text-anchor':i===0||i===3?'middle':i<3?'start':'end','dominant-baseline':'middle',fill:'#69718a','font-size':'9','font-family':'WMS Sora,Sora,Arial,sans-serif'},name);});
 return svg;
}
