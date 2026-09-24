import assert from "node:assert/strict";
import test from "node:test";
import { canPublishArticle, isArticleVisible, comparePublication } from "../src/lib/articlePublication.ts";

test("publication accepts a title and content in any one language, including images", () => {
  assert.equal(canPublishArticle({title:'', title_zhtw:'中文',content_zhtw:'<p>短文</p>'}),true);
  assert.equal(canPublishArticle({title:'Photo',image_urls:['https://example.com/photo.jpg']}),true);
  assert.equal(canPublishArticle({title:'Photo',content:'<p><img src="https://example.com/photo.jpg"></p>'}),true);
  assert.equal(canPublishArticle({title:'Empty',content:'<p>&nbsp;</p>'}),false);
  assert.equal(canPublishArticle({title:'',content:'text'}),false);
  assert.equal(canPublishArticle({title:'Empty',content:'<script>alert(1)</script>'}),false);
});
test("visibility is independent of indexing and does not invent language titles", () => {
  assert.equal(isArticleVisible({title:'Short',published:true}),true);
  assert.equal(isArticleVisible({title:'English',published:true},'zh-hk'),false);
  assert.equal(isArticleVisible({title:'Draft',published:false}),false);
});
test("publication order has a stable ID tie breaker", () => {
  const a={id:'a',published_at:'2026-01-01',created_at:'2026-02-01'};
  const b={...a,id:'b'};
  assert.deepEqual([b,a].sort(comparePublication),[a,b]);
  assert.ok(comparePublication({...a,published_at:'2026-03-01'},b)<0);
});
