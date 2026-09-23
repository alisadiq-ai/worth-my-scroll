// Isolated Chrome-for-Testing only. Key supplied via environment; never printed.
import {chromium} from 'playwright';
import assert from 'node:assert/strict';
const browser=await chromium.connectOverCDP(process.env.WMS_TEST_CDP||'http://127.0.0.1:9333');
const context=browser.contexts()[0];const worker=context.serviceWorkers().find(w=>w.url().endsWith('/background.js'));const base=worker?.url().replace('background.js','')||(process.env.WMS_TEST_EXTENSION_ID?`chrome-extension://${process.env.WMS_TEST_EXTENSION_ID}/`:null);
if(!base)throw Error('Load the test extension first, or set WMS_TEST_EXTENSION_ID.');
const page=await context.newPage();await page.goto(base+'popup.html');
const call=(type,extra={})=>page.evaluate(async({type,extra})=>{const r=await chrome.runtime.sendMessage({type,...extra});if(!r.ok)throw Error(r.error);return r.data;},{type,extra});
try{
 const prior=await call('GET_STATE');await call('REMOVE_KEY');await call('SAVE_SETTINGS',{settings:{...prior.settings,consent:false,enabled:false}});await page.reload();
 await page.getByLabel('Jev or Vercel Gateway API key').fill('ts_placeholder_for_provider_detection');assert.match(await page.locator('#detected').innerText(),/TypeSafe/);await page.getByLabel('Jev or Vercel Gateway API key').fill('unknown-key-format');assert.equal(await page.locator('#providerRow').isVisible(),true);
 const key=process.env.AI_GATEWAY_API_KEY;if(!key)throw Error('Provide AI_GATEWAY_API_KEY');
 await page.getByLabel('Jev or Vercel Gateway API key').fill(key);assert.match(await page.locator('#detected').innerText(),/Vercel AI Gateway detected/);
 await page.locator('#consent').check();await page.getByRole('button',{name:'Connect & start scoring'}).click();
 await page.locator('#connectResult').filter({hasText:'Connection verified. Feed status is shown above.'}).waitFor({timeout:25000});
 const current=await call('GET_STATE');assert.equal(current.provider,'gateway');assert.equal(current.settings.enabled,true);assert.equal(current.remembered,false);assert.equal(await page.locator('#apiKey').inputValue(),'');
 await page.setViewportSize({width:400,height:620});await page.screenshot({path:'output/playwright/popup-connected.png',fullPage:true});
 await page.getByRole('button',{name:'Pause scoring'}).click();await page.getByRole('button',{name:'Resume scoring'}).waitFor();assert.equal((await call('GET_STATE')).settings.enabled,false);
 await page.getByRole('button',{name:'Resume scoring'}).click();assert.equal((await call('GET_STATE')).settings.enabled,true);
 console.log('Popup verified: provider detection, one-step live connection, session key storage, pause/resume.');
}finally{await page.close();await browser.close();}
