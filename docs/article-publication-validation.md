# 本地驗收結果 — 2026-09-24

範圍：文章審查第 1、3、5、6、7、8 項。正式資料庫、Vercel 正式部署、正式 Edge Functions 及 cron 未修改。

| 驗收項目 | 結果與證據 |
| --- | --- |
| 共用發布規則、排序與同步狀態 | 11 項單元測試通過，涵蓋未知／過期狀態、待同步／建置／失敗、圖片及單語文章、穩定排序、清單與 HTML 版本 |
| 真實本地資料庫 | RPC 並行儲存只接受一個版本；過期刪除拒絕；文章不存在獨立回傳；非管理員拒絕、直接 API 更新拒絕；3 類 × 3 語言圖片文章可發布 |
| 日期 | 10 篇精確匹配修復；重跑 10 篇 already_correct、更新 0 筆；模擬後續人工改日期時保留並報 skipped_other_value；撤稿／重發不改日期，人工 set 有效 |
| 遷移與佇列 | 完整新遷移在隔離交易內重播成功並回滾；發布觸發、防抖、去重、建置中再編輯、重試與權限 SQL 測試通過 |
| 前台瀏覽器 | 9 個分類／語言列表、87 個詳情頁通過；修改內容、空結果、撤稿、改網址、服務失敗與重試通過；一般瀏覽沒有讀取舊快照 |
| 完整建置與 SEO | build:seo 通過：111 個公開靜態頁、96 個 sitemap 網址，15 個其餘公開頁明確 noindex；HTML 與清單版本一致 |
| SEO 反向測試 | 故意移除 noindex、插入真正斷鏈都令審查失敗，恢復檔案後通過 |
| 後台實際操作 | 本地登入後，無英文正文的清華校友交流圖片文章可儲存；顯示 Published / Sync pending，沒有偽造 Live |
| Edge Functions | deno check 通過；本地管理員 status 端點可用；本地 worker 回傳 503 明確禁止外部部署 |
| 編譯與靜態檢查 | TypeScript、修改範圍 ESLint、git diff --check 通過；audit:security 通過，但不是正式 RLS 或完整安全簽核 |
| 環境隔離 | 本地 API 127.0.0.1:54321、Docker context colima-foihk；本地 cron 0、發布密鑰名稱 0，符合不部署正式站的限制 |

可重跑命令、正式啟用順序、回復步驟見 `article-publication-repair.md`。日期來源與核對值見 `article-date-repair-20260924.csv`。

原有圖片／草稿權限（第 2 項）與 FAQ 載入／非交易儲存（第 4 項）未在此輪修復。沒有執行正式儲存、撤稿、部署、外部發布 Hook 或 IndexNow 發送。本地通過不等於正式站已完成修復。

驗收日誌位於忽略的 `.local/`：`final-acceptance.log`、`unit-results.log`、`pipeline-tests.log`、`edge-check.log`、`config-check.log`。開發服務持續在 localhost:5173 運行。
