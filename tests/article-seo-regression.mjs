import assert from 'node:assert/strict';
import {readFileSync,writeFileSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
const manifest=JSON.parse(readFileSync('dist/content-build.json','utf8'));
const url=manifest.publicUrls.find(url=>!manifest.urls.includes(url));assert.ok(url);
const path=`dist${new URL(url).pathname}/index.html`,original=readFileSync(path,'utf8');
const audit=()=>spawnSync(process.execPath,['scripts/audit-seo.js'],{encoding:'utf8'});
assert.equal(audit().status,0,'Run this test only after build:seo has finished successfully');
try {
 writeFileSync(path,original.replace(/noindex/g,'index'));let result=audit();assert.notEqual(result.status,0);assert.match(result.stderr,/non-indexable public URL must be noindex/);
 writeFileSync(path,original.replace('</main>','<a href="/en/articles/news-events/qa-missing-url">Broken link</a></main>'));
 result=audit();assert.notEqual(result.status,0);assert.match(result.stderr,/internal link has no public route/);
 console.log('PASS: intentional noindex routes are allowed; missing noindex and actual broken links still fail the SEO gate');
} finally {writeFileSync(path,original);}
