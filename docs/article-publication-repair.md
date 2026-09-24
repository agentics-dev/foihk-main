# 文章發布修復：本地驗收與正式環境交接

此變更處理審查第 1、3、5、6、7、8 項。正式資料庫、正式網站及正式發布服務均未修改。第 2 項圖片／草稿權限及第 4 項 FAQ 儲存風險不在此次修復範圍；不能把本次驗收視為完整安全簽核。

## 本地使用

- 網站：http://localhost:5173/zh-hk/articles/news-events
- 後台：http://localhost:5173/admin
- 本地 API：http://127.0.0.1:54321；資料庫容器 `supabase_db_foihk-local`，Docker context `colima-foihk`。
- 測試管理員登入資料存於 `.local/admin-access.json`，檔案權限 0600，不進 Git。這不是正式帳號。
- 已有環境啟動：`npm run local:setup`，然後 `npm run dev -- --host 127.0.0.1 --port 5173 --strictPort`。不要同時啟動第二個 5173。
- 首次啟動需要 Colima、Docker CLI、Node；腳本使用固定 Supabase CLI 2.117.0。只在獨立 `.local/runtime` 建立服務及套用遷移，不執行 link、push 或 deploy。
- 首次初始化從公開快照匯入 29 篇文章及新建測試管理員，不複製正式使用者、密碼或私有聯絡資料。新聞日期先重現已知錯誤，再執行受控修復。再次啟動不重置資料或登入資料。
- 若 Colima 的 Edge Runtime 缺少外部 DNS，可檢查容器 `/etc/resolv.conf`；本次本地容器使用 Docker resolver 加 1.1.1.1、8.8.8.8 解決 npm 模組載入失敗。
- 本地 worker 禁止外部部署。本地後台的 `Sync pending` 是真實待同步狀態，不會偽造正式站已驗證。

`.env.local` 僅存本地 API／公開金鑰，已忽略。開發模式拒絕連接遠端 Supabase；正式建置在 `VERCEL` 或 `CONTENT_BUILD_TARGET=production` 下只接受已核對的正式專案。

## 行為與接口

- 公開列表、首頁、慈善頁及詳情只查即時已發布資料；成功空結果不回填快照。失敗提供重試，詳情不把網絡錯誤當 404。歷史網址只轉到仍已發布、且該語言有標題的文章。
- 排序使用發布日期倒序，同時刻以 ID 穩定排序；以香港時區顯示。相同真實日期仍可相同，不為了視覺差異捏造日期。
- 文章增加 `edit_version bigint`。`save_article(_patch, _id?, _expected_version?, _date_action='preserve', _published_at?)` 回傳 `{outcome:'saved', article, revision}`；衝突／已刪除回傳 `conflict`／`not_found`。不接受任意欄位或缺少預期版本的既有文章更新。
- `delete_article(_id, _expected_version)` 使用相同版本鎖，回傳 `deleted`、`conflict` 或 `not_found`。兩個 RPC 都在資料庫內驗證管理員，僅允許 authenticated 呼叫；撤除 authenticated 直接寫 articles 的權限，避免繞過版本／日期規則。服務角色維護權限仍保留。
- 一般儲存、撤稿與重發保留發布日期；首次發布日期為空時由資料庫填入。明確改日期用 `set`，仍受版本保護。`public_updated_at` 與發布日期獨立。
- 至少一種語言有標題及正文或圖片即可發布；草稿可未完成。事件與 SEO 資料完整度為編輯提示，不再讓兩個發布入口採用不同必填條件。
- FAQ 仍獨立儲存，不具有整篇交易保障；版本衝突會在 FAQ 寫入前停止，但本次沒有修復 FAQ 載入競態或刪除邏輯。
- 內容清單 v2：`revision`、`generatedAt`、`urls`（可索引）、`publicUrls`（全部公開網址）、`formatVersion:2`。所有公開網址都預渲染；短文／圖片文章可訪問但 noindex。預渲染的 API 回應固定在同一快照，HTML 帶同一內容版本。
- 訪客重新讀取後可立即看到已儲存資料。靜態 HTML、無 JavaScript 訪問及搜尋引擎版本要等待部署，後台另顯示同步狀態；不承諾已下載或快取的舊內容即時消失。

## 測試

```sh
npm run test:articles
npm run test:site-deploy
npm run test:articles:integration
npm run test:publishing:sql
npm run build:seo
node tests/article-seo-regression.mjs
npx tsc --noEmit -p tsconfig.app.json
```

整合測試限制 API 必須是 `127.0.0.1:54321`，以獨立測試文章驗證並行編輯、舊版刪除、手動日期、撤稿／重發、中文／純圖片與管理員權限，最後清理測試文章。SQL 佇列測試整個交易回滾，驗證防抖、合併、失敗重試、版本及權限。

瀏覽器回歸涵蓋三類文章、三種語言，共 9 個列表及 87 個詳情頁；另刻意製造快照／即時差異、撤稿、空結果、改網址、錯誤與重試。SEO 反向測試確認真正斷鏈及缺失 noindex 仍會阻擋建置。

日期核對表見 `article-date-repair-20260924.csv`。SQL `update_news_published_dates.sql` 只比對確定的 ID＋舊時間，輸出 repaired、already_correct、skipped_other_value 或 missing；正式修復不能忽略差異結果。

## 正式啟用順序（尚未執行）

1. 本地驗收後另行確認正式變更。正式前端目前連接 `qrypqhzxbvfvtgxeerzi`；重新核對 Vercel 環境、Supabase schema、遷移歷史及角色。禁止將整套舊遷移直接 push 到正式站。
2. 保存文章資料、發布日期、權限與函式定義及上一個可回復的網站版本；暫停編輯寫入。核對 articles、FAQ、slug history 的既有欄位與 private schema。缺少 private schema 時只建立發布流程所需的私有 schema 並撤除 public／anon／authenticated 使用權限。
3. 針對缺失的發布物件套用經比較後的 `20260817022313_site_content_deploy_pipeline.sql`，再套用 `20260924025038_article_edit_contract.sql`。不要執行無關聯絡表單、圖片政策等舊遷移。以管理員／非管理員角色確認 RPC 與直接寫入權限。
4. 在交易內執行日期修復，保存每篇前後值及輸出；只有 ID 和已知錯誤日期吻合才更正。確認 10 篇及其他文章數量／狀態不變。
5. 設定正式 Edge Functions 的 Vercel deploy hook、worker secret，以及 Vault 對應值。沿用既有 `private.install_site_deploy_cron()` 的需求，先保持 cron 關閉；密鑰只經環境／Vault 注入，不進聊天、Git 或前端。Edge 使用 `VERCEL_DEPLOY_HOOK_URL`、`CONTENT_DEPLOY_WORKER_SECRET`（至少 32 字元）；Vault 名稱為 `site_deploy_project_url`、`site_deploy_publishable_key`、`site_deploy_worker_secret`。`INDEXNOW_KEY` 用於搜尋通知。`GITHUB_AUDIT_TOKEN` 必須是只能向 `agentics-dev/foihk-main` 發送 `repository_dispatch` 的細粒度 token；部署驗證完成後用它觸發網站異常巡檢，缺失或調用失敗不回滾已驗證的部署，並在 worker 回應中明確返回 `auditDispatchError`。可先執行唯讀 `scripts/check-publishing.sql` 檢查物件、直接寫入權限、cron 與密鑰名稱是否齊全，不輸出密鑰值。
6. 發布新網站與新版 `site-deploy-admin`、`site-deploy-worker`，核對内容版本、111 個公開網址／96 個索引網址基線（正式內容變更時重新計算）、日期及 noindex。新建置不得使用本地 env、版本 0 或舊快照回退。
7. 最後安裝／啟用 cron，執行受控的正式內容同步驗收。只有目標版本、靜態 HTML 版本、路由、移除／轉址及 sitemap 全部通過才可標記同步完成。IndexNow 結果與文章可訪問性分開確認。

## 回復

- 本地：停止 Vite；`npx supabase@2.117.0 stop --workdir .local/runtime` 搭配本地 Docker context 可停止服務，保留資料。不要刪除 volumes 作為一般重啟方法。
- 正式發布異常：先暫停 cron 和編輯，保留錯誤、版本及佇列記錄。可回復網站版本，但舊後台不支援新 RPC，不能單獨回復前端後就重新開放寫入。
- 若必須回復編輯接口，依事前備份還原精確權限／函式，再配套回復前端；不可為了恢復操作而開放所有 authenticated 寫入。
- 日期回復只能針對本次確實 repaired、且尚未被後續編輯的記錄，以修復前值及版本條件執行；不得將全部文章批量設成同一天。
