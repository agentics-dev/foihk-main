import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {randomUUID} from 'node:crypto';
import {createClient} from '@supabase/supabase-js';
const env=JSON.parse(readFileSync('.local/supabase.json','utf8'));
assert.equal(env.API_URL,'http://127.0.0.1:54321','Never run write tests against production');
const client=createClient(env.API_URL,env.ANON_KEY,{auth:{persistSession:false}});
const admin=createClient(env.API_URL,env.SERVICE_ROLE_KEY,{auth:{persistSession:false}});
const access=JSON.parse(readFileSync('.local/admin-access.json','utf8'));
const {error:loginError}=await client.auth.signInWithPassword(access);assert.equal(loginError,null);
const ids=[];
const call=async(args)=>{const r=await client.rpc('save_article',args);assert.equal(r.error,null,JSON.stringify(r.error));return r.data;};
try {
  let r=await call({_patch:{title:'',content:'',slug:`integration-${randomUUID()}`,category:'news_events',published:false}});
  let a=r.article;ids.push(a.id);assert.equal(a.published_at,null);assert.equal(a.edit_version,1);
  let invalid=await client.rpc('save_article',{_id:a.id,_expected_version:a.edit_version,_patch:{published:true}});assert.equal(invalid.error?.code,'23514');
  r=await call({_id:a.id,_expected_version:a.edit_version,_patch:{title_zhtw:'中文短文',content_zhtw:'<p>內容</p>',published:true}});a=r.article;
  assert.ok(a.published_at);const original=a.published_at;
  const competing=await Promise.all(['A','B'].map(title=>call({_id:a.id,_expected_version:a.edit_version,_patch:{title_zhtw:title}})));
  assert.equal(competing.filter(r=>r.outcome==='saved').length,1);assert.equal(competing.filter(r=>r.outcome==='conflict').length,1);
  a=competing.find(r=>r.outcome==='saved').article;
  for(const published of [false,true]){r=await call({_id:a.id,_expected_version:a.edit_version,_patch:{published}});a=r.article;assert.equal(a.published_at,original);}
  r=await call({_id:a.id,_expected_version:a.edit_version,_patch:{},_date_action:'set',_published_at:'2025-12-01T00:00:00Z'});a=r.article;
  assert.equal(Date.parse(a.published_at),Date.parse('2025-12-01T00:00:00Z'));
  const direct=await client.from('articles').update({published_at:'2020-01-01'}).eq('id',a.id);assert.ok(direct.error,'Direct writes must not bypass version/date checks');
  const staleDelete=await client.rpc('delete_article',{_id:a.id,_expected_version:a.edit_version-1});assert.equal(staleDelete.data.outcome,'conflict');
  const removed=await client.rpc('delete_article',{_id:a.id,_expected_version:a.edit_version});assert.equal(removed.data.outcome,'deleted');
  assert.equal((await call({_id:a.id,_expected_version:a.edit_version,_patch:{title:'Gone'}})).outcome,'not_found');
  for (const category of ['news_events','education_research','philanthropy']) {
    for (const suffix of ['','_zhtw','_zhcn']) {
      const patch={title:'',content:'',slug:`image-${randomUUID()}`,category,published:true,image_urls:['https://example.com/image.jpg'],[`title${suffix}`]:'Photo / 圖片'};
      const saved=await call({_patch:patch});ids.push(saved.article.id);assert.equal(saved.outcome,'saved');
    }
  }
  const outsider=createClient(env.API_URL,env.ANON_KEY,{auth:{persistSession:false}});
  const user=await admin.auth.admin.createUser({email:`outsider-${randomUUID()}@example.test`,password:randomUUID(),email_confirm:true});
  try {
    const {data:link,error}=await admin.auth.admin.generateLink({type:'magiclink',email:user.data.user.email});assert.equal(error,null);
    const auth=await outsider.auth.verifyOtp({token_hash:link.properties.hashed_token,type:'magiclink'});assert.equal(auth.error,null);
    const denied=await outsider.rpc('save_article',{_patch:{title:'unauthorized'}});assert.equal(denied.error?.code,'42501');
  } finally {await admin.auth.admin.deleteUser(user.data.user.id);}
  const fixture=JSON.parse(readFileSync('tests/fixtures/news-publication.json','utf8')).articles;
  const {data:news,error}=await admin.from('articles').select('id,published_at').eq('category','news_events');assert.equal(error,null);
  for(const item of fixture)assert.equal(Date.parse(news.find(a=>a.id===item.id).published_at),Date.parse(item.expected_published_at));
  console.log('PASS: real local DB version conflicts, deletion races, dates, all categories/languages, image-only publication, permission boundary, 15 historical dates');
} finally {await admin.from('articles').delete().in('id',ids);}
