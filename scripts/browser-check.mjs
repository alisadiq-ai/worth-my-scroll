// Run against an isolated Chrome-for-Testing session started with the extension.
// Never attach this harness to a normal personal browser. No remote saves/posts.
import {chromium} from 'playwright';import {readFile,writeFile,mkdir} from 'node:fs/promises';
const browser=await chromium.connectOverCDP(process.env.WMS_TEST_CDP||'http://127.0.0.1:9333');
const context=browser.contexts()[0];
const worker=context.serviceWorkers().find(w=>w.url().endsWith('/background.js'));if(!worker)throw Error('No test extension worker');
const base=worker.url().replace(/\/background\.js$/, '');
const page=await context.newPage();await page.goto(base+'/demo.html');
const call=(type,extra={})=>page.evaluate(async({type,extra})=>{const r=await chrome.runtime.sendMessage({type,...extra});if(!r.ok)throw Error(r.error);return r.data;},{type,extra});
const original=await call('GET_STATE');if(!original.hasKey)throw Error('Provision a session-only Gateway key first.');
const report={at:new Date().toISOString(),checks:[]};const check=(name,condition)=>{if(!condition)throw Error(name);report.checks.push(name);};
let feed,stash;
try{
 await page.getByRole('button',{name:'Score with Jev ↗'}).click();
 await page.getByText(/Live Jev · 3\/3 scored/).waitFor();
 check('three live demo ratings rendered',await page.locator('wms-rating').count()===3);
 check('recreate score shown on matching builder post',await page.locator('.post').first().getByText(/✦ Recreate \d+$/).count()===1);
 await page.locator('.post').first().getByRole('button',{name:'Why?'}).click();
 check('explanations expand',await page.locator('.post').first().locator('.details').isVisible());
 await page.screenshot({path:'output/playwright/demo-full.png',fullPage:true});
 const firstUsage=(await call('GET_STATE')).usage.count;
 await page.getByRole('button',{name:'Score with Jev ↗'}).click();await page.getByText(/Live Jev · 3\/3 scored/).waitFor();
 check('repeat scoring uses cache', (await call('GET_STATE')).usage.count===firstUsage);
 await page.setViewportSize({width:390,height:844});
 check('demo fits narrow viewport',await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
 await page.screenshot({path:'output/playwright/demo-mobile.png',fullPage:true});await page.setViewportSize({width:1380,height:980});
 // A synthetic page at a matched URL exercises the installed content script.
 const fixture='<!doctype html><html><head><style>body{font:15px Arial;background:#f6f8fc;margin:30px}main{width:650px;margin:auto}article{background:white;padding:0 0 15px;margin:20px 0;border:1px solid #ddd;border-radius:10px}p,span[data-testid]{display:block;padding:18px}</style></head><body><main>'+
 '<article role="listitem" componentkey="update-card-test1" data-urn="urn:li:activity:1234567890123456789"><h2>Feed post</h2><span data-testid="expandable-text-box">We shipped semantic search in our invoicing app this week. Embeddings alone kept missing invoice numbers. So we added an exact-match path before the vector lookup. On our 80-query test set, correct retrieval went from 61 to 74 queries. The tradeoff? Two indexes to maintain. Small feature. A lot less searching.</span></article>'+
 '<article role="listitem" componentkey="update-card-ad"><h2>Feed post</h2><p><span>Promoted</span></p><span data-testid="expandable-text-box">A sponsored message about an AI tool. This must remain unscored.</span></article></main></body></html>';
 await context.route('https://www.linkedin.com/feed/wms-test/',route=>route.fulfill({status:200,contentType:'text/html',body:fixture}));
 const stashFixture=await readFile('tests/fixtures/favstash.html','utf8');
 await context.route('https://www.favstash.app/dashboard/stash*',route=>route.fulfill({status:200,contentType:'text/html',body:stashFixture}));
 feed=await context.newPage();await feed.goto('https://www.linkedin.com/feed/wms-test/');
 await feed.locator('wms-rating').waitFor({timeout:30000});
 check('installed content script scores the fixture',await feed.locator('wms-rating').count()===1);
 check('modern sponsored post left untouched',await feed.locator('[componentkey="update-card-ad"] wms-rating').count()===0);
 await feed.screenshot({path:'output/playwright/content-script.png',fullPage:true});
 const popup=context.waitForEvent('page');await feed.getByRole('button',{name:'Save to Stash'}).click();stash=await popup;await stash.waitForLoadState();
 // Chrome-created tabs can begin before routing attaches. Validate the handoff,
 // then use a fresh controlled fixture tab to test the form helper.
 const handoffId=await page.evaluate(async()=>{const {handoffs}=await chrome.storage.session.get('handoffs');return Object.entries(handoffs).sort((a,b)=>b[1].at-a[1].at)[0][0];});
 check('FavStash handoff created',!!handoffId);await stash.close();stash=await context.newPage();
 await stash.route('**/*',route=>route.request().isNavigationRequest()?route.fulfill({status:200,contentType:'text/html',body:stashFixture}):route.abort());
 await stash.goto('https://www.favstash.app/dashboard/stash?fixture=1#wms='+handoffId,{waitUntil:'domcontentloaded'});
 await stash.getByRole('heading',{name:'FavStash form fixture'}).waitFor({timeout:5000});
 await stash.getByRole('button',{name:'Prepare save form'}).click();
 await stash.getByRole('button',{name:'Prepared ✓'}).waitFor({timeout:5000});
 check('FavStash public URL prefilled',await stash.locator('input[type="url"]').inputValue()==='https://www.linkedin.com/feed/update/urn:li:activity:1234567890123456789/');
 check('recreation brief prefilled', (await stash.locator('textarea').inputValue()).includes('Recreate potential'));
 check('collection remains a user choice',await stash.getByLabel('Collection').inputValue()==='No collection');
 await stash.screenshot({path:'output/playwright/favstash-handoff.png',fullPage:true});
 await call('SAVE_SETTINGS',{settings:{...original.settings,enabled:false}});
 await feed.locator('wms-rating').waitFor({state:'detached',timeout:10000});check('pause removes existing ratings',await feed.locator('.wms-rated').count()===0);
 const u=(await call('GET_STATE')).usage;report.usage={count:u.count,input:u.input,output:u.output,averageMs:Math.round(u.ms/u.count)};
 await mkdir('output',{recursive:true});await writeFile('output/browser-check.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
}finally{
 await call('SAVE_SETTINGS',{settings:original.settings});await feed?.close();await stash?.close();await page.close();await browser.close();
}
