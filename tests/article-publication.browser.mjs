import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import puppeteer from 'puppeteer';
import {preview} from 'vite';
const articles=JSON.parse(readFileSync('public/published-articles.json','utf8'));
const server=await preview({preview:{host:'127.0.0.1',port:0,open:false}});
const origin=`http://127.0.0.1:${server.httpServer.address().port}`;
const browser=await puppeteer.launch({headless:true,args:['--no-sandbox']});
let live=articles, fail=false, snapshotRequests=0;
try {
 const page=await browser.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.setRequestInterception(true);
 page.on('request',request=>{
  const url=new URL(request.url());const headers={'access-control-allow-origin':'*','access-control-allow-headers':'*','access-control-allow-methods':'GET,OPTIONS'};
  if(url.pathname==='/published-articles.json'){snapshotRequests++;return request.respond({status:200,contentType:'application/json',body:JSON.stringify(articles)});}
  if(url.pathname==='/rest/v1/articles'){
   const cat=url.searchParams.get('category')?.replace(/^eq\./,'');
   return request.respond({status:fail?503:200,contentType:'application/json',headers,body:JSON.stringify(fail?{message:'unavailable'}:live.filter(a=>(!cat||a.category===cat)&&a.published))});
  }
  if(url.pathname.startsWith('/rest/v1/'))return request.respond({status:200,contentType:'application/json',headers,body:'[]'});
  if(url.origin!==origin||['image','font','media'].includes(request.resourceType()))return request.abort();
  request.continue();
 });
 let details=0;
 for(const category of ['news_events','education_research','philanthropy'])for(const lang of ['en','zh-hk','zh-cn']){
  const field=lang==='en'?'title':lang==='zh-hk'?'title_zhtw':'title_zhcn';
  await page.goto(`${origin}/${lang}/articles/${category.replaceAll('_','-')}`,{waitUntil:'domcontentloaded'});
  await page.waitForSelector('main[data-content-ready="true"]');
  const cards=await page.$$eval('[data-content-card]',elements=>elements.map(e=>({title:e.querySelector('h3').textContent.trim(),date:e.querySelector('time').dateTime,href:e.closest('a').href})));
  const expected=articles.filter(a=>a.category===category&&a[field]?.trim());
  assert.deepEqual(cards.map(a=>a.title).sort(),expected.map(a=>a[field].trim()).sort());
  for(let i=0;i<cards.length;i++){
   const card=cards[i],a=expected.find(a=>a[field].trim()===card.title);
   assert.equal(Date.parse(card.date),Date.parse(a.published_at||a.created_at));
   if(i)assert.ok(Date.parse(cards[i-1].date)>=Date.parse(card.date));
   await page.goto(card.href,{waitUntil:'domcontentloaded'});await page.waitForSelector('main article header time').catch(async e=>{throw new Error(card.href+' '+await page.$eval('main',e=>e.textContent)+' '+errors.join(';'));});
   assert.equal(Date.parse(await page.$eval('main article header time',e=>e.dateTime)),Date.parse(card.date));details++;
  }
 }
 console.log(`Verified ${details} article detail pages`);
 const selected=articles.find(a=>a.category==='news_events' && /^[a-z0-9-]+$/.test(a.slug));
 const list=`${origin}/en/articles/news-events`,detail=`${list}/${selected.slug}`;
 live=articles.map(a=>a.id===selected.id?{...a,title:'Updated title confirmed'}:a);
 await page.goto(detail,{waitUntil:'domcontentloaded'});await page.waitForSelector('main article header time');assert.equal(await page.$eval('main h1',e=>e.textContent.trim()),'Updated title confirmed');
 live=[];await page.goto(list,{waitUntil:'domcontentloaded'});await page.waitForSelector('main[data-content-ready="true"]');assert.equal((await page.$$('[data-content-card]')).length,0);
 await page.goto(detail,{waitUntil:'domcontentloaded'});await page.waitForSelector('main h1');assert.match(await page.$eval('main h1',e=>e.textContent),/Not Found/);
 live=[{...selected,slug:'renamed-article'}];await page.goto(list,{waitUntil:'domcontentloaded'});await page.waitForSelector('main[data-content-ready="true"]');assert.equal((await page.$$('[data-content-card]')).length,1);
 assert.match(await page.$eval('[data-content-card]',e=>e.closest('a').href),/renamed-article$/);
 fail=true;await page.goto(detail,{waitUntil:'domcontentloaded'});await page.waitForSelector('main [role="alert"]');
 assert.match(await page.$eval('main',e=>e.textContent),/temporarily unavailable/);
 fail=false;live=articles;await page.click('main [role="alert"] button');await page.waitForSelector('main article header time');
 assert.equal(snapshotRequests,0,'Runtime must never resurrect snapshot articles');
 assert.deepEqual(errors,[]);
 console.log(`PASS: 9 category/language lists, ${details} details, edits, empty live results, removals, renamed URLs, failure and retry; no runtime snapshot fallback`);
}finally{await browser.close();await new Promise(r=>server.httpServer.close(r));}
