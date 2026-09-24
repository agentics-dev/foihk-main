import assert from 'node:assert/strict';
import test from 'node:test';
import {getArticleSyncLabel, type SyncStatus} from '../src/lib/articleSync.ts';
test('unknown, stale and unverified responses cannot claim synchronization',()=>{
 const state:SyncStatus={status:'live',desiredRevision:4,deployedRevision:4,verifiedAt:'2026-01-01',pendingArticleIds:[],receivedAt:100000};
 assert.equal(getArticleSyncLabel(null,'a',100000),'Sync unavailable');
 assert.equal(getArticleSyncLabel(state,'a',161000),'Sync unavailable');
 assert.equal(getArticleSyncLabel({...state,verifiedAt:null},'a',100000),'Sync unavailable');
 assert.equal(getArticleSyncLabel(state,'a',100000),'Sync verified');
 for(const [status,label] of [['queued','Sync pending'],['building','Syncing'],['failed','Sync failed']] as const)
  assert.equal(getArticleSyncLabel({...state,status,desiredRevision:5,pendingArticleIds:['a']},'a',100000),label);
});
