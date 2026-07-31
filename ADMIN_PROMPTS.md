# Admin 後台管理系統 — 完整功能提示詞集合

> **文件版本**: v1.0  
> **適用框架**: React + TypeScript + Vite + BaaS（如 Supabase / Firebase）  
> **適用對象**: AI 輔助開發工具（如 Cursor、Copilot、Trae）  
> **設計原則**: 所有提示詞拆除了私有配置與定製化邏輯，可直接在任一獨立網站部署  

---

## 目錄

1. [系統架構總覽](#1-系統架構總覽)
2. [模組一：管理員認證與授權](#2-模組一管理員認證與授權)
3. [模組二：內容管理（文章 CRUD）](#3-模組二內容管理文章-crud)
4. [模組三：多語言內容編輯](#4-模組三多語言內容編輯)
5. [模組四：圖片管理與裁剪](#5-模組四圖片管理與裁剪)
6. [模組五：發布狀態與草稿管理](#6-模組五發布狀態與草稿管理)
7. [模組六：聯絡表單管理](#7-模組六聯絡表單管理)
8. [模組七：預覽系統](#8-模組七預覽系統)
9. [跨站部署注意事項](#9-跨站部署注意事項)
10. [功能驗證清單](#10-功能驗證清單)

---

## 1. 系統架構總覽

### 1.1 路由結構

| 路徑 | 元件 | 說明 |
|------|------|------|
| `/admin` | Auth | 管理員登入頁 |
| `/admin/dashboard` | AdminDashboard | 後台主面板（需登入 + admin 角色） |

### 1.2 資料庫核心表

| 表名 | 用途 | 關鍵欄位 |
|------|------|----------|
| `articles` | 文章內容 | id, title, slug, excerpt, content, category, image_urls, image_metadata(JSONB), published, published_at, 多語言欄位 |
| `user_roles` | 使用者角色 | user_id (FK → auth.users), role (enum: admin/moderator) |
| `contact_submissions` | 聯絡表單提交 | name, email, subject, message |
| `storage` (bucket: `article-images`) | 圖片存儲 | 檔案上傳 / 公開讀取 |

### 1.3 多語言欄位規範

每篇文章的每個文字欄位都有三個語言版本：

| 欄位後綴 | 語言 |
|----------|------|
| `title` / `excerpt` / `content` | 英文 (English) |
| `title_zhtw` / `excerpt_zhtw` / `content_zhtw` | 繁體中文 (zh-TW) |
| `title_zhcn` / `excerpt_zhcn` / `content_zhcn` | 簡體中文 (zh-CN) |

### 1.4 角色權限體系

| 角色 | 權限範圍 |
|------|----------|
| `admin` | 完整權限：CRUD 文章、管理圖片、查看聯絡表單、管理使用者角色 |
| `moderator` | 可擴展為部分權限（如僅編輯不可刪除） |
| 一般使用者 (authenticated) | 僅可查看已發布文章 |
| 匿名使用者 | 僅可查看已發布文章 |

---

## 2. 模組一：管理員認證與授權

### 2.1 登入頁面

#### 提示詞 #AUTH-001：建立管理員登入頁面

```
【功能名稱】管理員登入頁面
【核心目標】提供安全的電子郵件/密碼登入介面，阻止未授權使用者進入後台

【操作步驟】
1. 使用者訪問 /admin 路徑，顯示登入表單
2. 輸入電子郵件和密碼，點擊「Sign In」按鈕
3. 系統透過 BaaS（如 Supabase Auth / Firebase Auth）驗證憑證
4. 驗證成功：自動導向 /admin/dashboard
5. 驗證失敗：在頁面上顯示具體錯誤訊息（如「Invalid login credentials」）
6. 已登入的使用者訪問 /admin 時，自動跳轉至 /admin/dashboard

【UI 設計要求】
- 頁面全螢幕置中，使用漸層背景（from-background to-secondary/30）
- 登入卡片（Card）最大寬度 400px（max-w-md），帶陰影
- 標題顯示專案名稱（如「[專案名] Admin」）+ 副標「Sign in to manage content」
- 表單欄位：Email 輸入框（type="email"）和 Password 輸入框（type="password"）
- 登入按鈕：全寬 + loading 狀態顯示 spinner
- 不顯示註冊頁籤（或隱藏註冊選項以增強安全性）

【權限約束】
- 僅驗證通過的 active session 才可訪問後台
- 不依賴前端路由守衛，後端必須有對應的 RLS（Row Level Security）策略

【異常處理規則】
- 網路錯誤：顯示 "Network error. Please check your connection."
- 無效憑證：顯示後端回傳的錯誤訊息
- Session 過期：自動登出並導回 /admin
- 未授權角色：顯示 "You do not have administrator privileges" 並強制登出

【輸出格式要求】
- 建置一個 React 元件檔案 Auth.tsx
- 使用 react-router-dom 的 useNavigate 進行路由導向
- 使用 BaaS client library 進行 auth.signInWithPassword 呼叫
```

---

### 2.2 權限守衛（Dashboard Guard）

#### 提示詞 #AUTH-002：建立 Admin Dashboard 權限守衛

```
【功能名稱】Admin Dashboard 權限守衛
【核心目標】在 Dashboard 載入時雙重驗證：Session 存在 + 使用者具備 admin 角色

【操作步驟】
1. 元件 mount 時，呼叫 getSession() 檢查當前 session
2. 若無 session：立即導向 /admin 並 return null（不渲染任何內容）
3. 若有 session：查詢 user_roles 表，確認該 user_id 是否有 role='admin'
4. 若無 admin 角色：顯示 toast「Access Denied」→ 執行 signOut() → 導向 /admin
5. 同時訂閱 onAuthStateChange 事件，若在其他分頁登出則自動跳轉
6. 全部驗證通過：將 session 存入 state 並正常渲染 Dashboard

【權限約束】
- 每次 Dashboard 頁面載入都必須檢查，不可依賴 localStorage 快取
- 使用 SECURITY DEFINER 函數或 REST API 查詢角色，避免遞迴 RLS

【異常處理規則】
- user_roles 查詢錯誤：視為權限不足，執行 signOut + 導回 /admin
- onAuthStateChange 觸發且 session 為 null：導回 /admin
- 使用 setTimeout 延遲角色檢查以避開 auth state change deadlock

【輸出格式要求】
- 在 Dashboard 元件中使用 useEffect 和 useState
- session 為 null 時 return null（不渲染任何 UI）
- 使用 toast 元件顯示拒絕訪問訊息
```

---

## 3. 模組二：內容管理（文章 CRUD）

### 3.1 文章列表

#### 提示詞 #CONTENT-001：建立文章列表管理元件

```
【功能名稱】文章列表（含分類頁籤）
【核心目標】按分類顯示所有文章，支援編輯、發布/取消發布、刪除操作

【操作步驟】
1. 元件接收兩個 props：category（分類）和 onEdit（編輯回調函數）
2. Mount 時從資料庫查詢該分類所有文章，按 created_at 降序排列
3. 以 Card 列表形式渲染每篇文章，包含：
   - 第一張圖片的縮圖（24x24），若圖片 > 1 張則在角落顯示數量 badge
   - 標題（CardTitle）、摘要（CardDescription）
   - 建立日期（帶 Calendar 圖示）
   - 發布狀態 badge（Published / Draft）
   - 操作按鈕：Edit、Publish/Unpublish、Delete
4. 無文章時顯示空狀態：Card + "No articles yet. Create your first one!"
5. Loading 時顯示 "Loading..."

【按鈕功能詳情】
- Edit：呼叫父元件的 onEdit(article) 回調，切換到編輯表單
- Publish/Unpublish：toggle published 欄位，同步更新 published_at
- Delete：彈出 AlertDialog 確認 → 確認後執行刪除 → 重新 fetch 列表

【權限約束】
- 刪除操作必須有二次確認對話框（AlertDialog），防止誤刪
- 所有 CRUD 操作由資料庫 RLS 策略確保僅 admin 角色可執行

【異常處理規則】
- fetch 失敗：toast "Failed to fetch articles"
- delete 失敗：toast "Failed to delete article"
- toggle 失敗：toast "Failed to update article"

【輸出格式要求】
- 建置 ArticleList.tsx 元件
- 使用 Card、CardHeader、CardContent、Badge 等 UI 組件
- 使用 AlertDialog 進行刪除確認
- 支援 loading / empty / 列表三種狀態
```

---

### 3.2 文章表單（建立 / 編輯）

#### 提示詞 #CONTENT-002：建立文章表單元件

```
【功能名稱】文章建立與編輯表單
【核心目標】提供完整的文章內容編輯器，支援多語言輸入、圖片上傳、發布控制、預覽

【操作步驟】
1. 元件接收 props：article（編輯模式時傳入）、category、onSuccess、onCancel
2. 編輯模式：從 article 物件回填所有欄位到 state
3. 使用者填寫以下欄位（分三個語言頁籤）：
   
   【英文頁籤】
   - Title（必填）
   - Description（摘要）
   - Content（必填，富文本編輯器）
   
   【繁體中文頁籤】
   - 標題、摘要、內容（均選填）
   
   【簡體中文頁籤】
   - 标题、摘要、内容（均選填）

4. Slug 欄位：新建時從英文標題自動生成（lowercase + 空格轉連字號 + 移除特殊字元），
   編輯時可手動修改
5. Created Date：使用 Calendar 彈出選擇器，預設為當天
6. 圖片上傳區（見模組四）
7. 發布開關（Switch）：控制 published 狀態
8. 提交按鈕：
   - 新建：INSERT INTO articles
   - 編輯：UPDATE articles WHERE id = article.id
   - 發布時自動寫入 published_at 時間戳
9. 成功後呼叫 onSuccess()，切回文章列表

【富文本編輯器配置】
- 使用 ReactQuill 或等價的 WYSIWYG 編輯器
- 支援：header levels、font family、font size、bold/italic/underline/strike、
  text color、background color、text align、ordered/unordered list、
  indent、link、image、video、blockquote、code-block、superscript/subscript
- 每個語言頁籤有獨立的編輯器實例

【權限約束】
- 新建與編輯操作均由 RLS 策略確保僅 admin 可執行
- 前端表單驗證：title 和 content（英文）為必填

【異常處理規則】
- 圖片上傳失敗：toast 顯示錯誤，阻止表單提交
- 資料庫寫入失敗：toast 顯示後端錯誤訊息
- 網路中斷：保留已填寫的表單資料，不遺失使用者輸入

【輸出格式要求】
- 建置 ArticleForm.tsx 元件
- 使用 Tabs 元件切換三個語言頁籤
- 使用 ReactQuill（或等價富文本編輯器）
- 表單使用原生 <form onSubmit> 處理提交
- Loading 狀態顯示 spinner
```

---

## 4. 模組三：多語言內容編輯

#### 提示詞 #LANG-001：實作多語言內容管理

```
【功能名稱】三語言內容管理（EN / ZH-TW / ZH-CN）
【核心目標】讓管理員可為每篇文章分別填寫英文、繁體中文、簡體中文內容，
            前台根據使用者選擇的語言自動顯示對應版本

【資料庫設計】
- 每個可翻譯的文字欄位需有三個版本：
  - 主欄位（預設英文）：title, excerpt, content
  - 繁體中文：title_zhtw, excerpt_zhtw, content_zhtw
  - 簡體中文：title_zhcn, excerpt_zhcn, content_zhcn
- 中文欄位設為 NULLABLE（可為空）

【前台讀取邏輯（getLocalizedField 函數）】
  輸入：article 物件、欄位名稱（如 "title"）、當前語言
  輸出：對應語言的文字內容
  邏輯：
    1. 若 language === "zh-TW" 且 article.title_zhtw 有值 → 回傳 title_zhtw
    2. 若 language === "zh-CN" 且 article.title_zhcn 有值 → 回傳 title_zhcn
    3. 否則 → 回傳 article.title（英文 fallback）

【後台編輯介面】
- 表單內使用 Tabs 元件，三個頁籤：
  - English（必填主語言）
  - 繁體中文（選填）
  - 简体中文（選填）
- 切換頁籤時保留各自已輸入的內容
- 英文標題變更時自動更新 slug

【操作步驟】
1. 管理員在編輯表單中切換到目標語言頁籤
2. 填寫該語言的標題、摘要、富文本內容
3. 點擊儲存，所有語言版本一併寫入資料庫同一行
4. 前台偵測使用者語言偏好，自動選擇顯示版本

【權限約束】
- 前台讀取邏輯僅做 fallback，不依賴權限
- 後台寫入由 admin RLS 保護

【異常處理規則】
- 若所有語言版本的某欄位均為空：前台顯示空字串（不報錯）
- 儲存時中文欄位可為空，不影響英文主內容

【輸出格式要求】
- 建立 getLocalizedField 工具函數於 utils.ts
- 前台所有文章渲染處使用此函數獲取文字
- 後台提供 LanguageContext 供全域語言切換
```

---

## 5. 模組四：圖片管理與裁剪

### 5.1 圖片上傳與排序

#### 提示詞 #IMAGE-001：建立多圖片上傳與拖曳排序功能

```
【功能名稱】多圖片上傳與拖曳排序
【核心目標】支援最多 5 張圖片的上傳、拖曳排序、刪除以及逐張裁剪

【操作步驟】
1. 點擊「Upload Images」按鈕（顯示已上傳數量 / 5）
2. 達到 5 張上限後按鈕 disabled
3. 圖片分兩區顯示：
   - Existing Images：已存在於資料庫的圖片，支援拖曳排序、刪除、裁剪
   - New Images：本次新上傳的圖片（上傳前顯示 local blob URL）
4. 每張圖片顯示為縮圖卡片：
   - 已裁剪的圖片使用 CroppedImage 元件渲染
   - 未裁剪的圖片使用標準 object-cover 顯示
   - Hover 時顯示操作按鈕：裁剪（⛶）和刪除（✕）
   - 左上角有拖曳手柄（GripVertical 圖示）
5. 拖曳排序使用 @dnd-kit 套件：
   - 現有圖片和新增圖片各自獨立可排序
   - 使用 closestCenter 碰撞檢測和 sortableKeyboardCoordinates

【資料儲存格式】
- image_urls：字串陣列，存於 articles 表的 text[] 欄位
- image_metadata：JSONB 物件，key 為圖片 URL，value 為裁剪參數
  格式：{
    "https://example.com/img1.jpg": {
      "crop": { "x": 0, "y": 0 },
      "zoom": 1,
      "croppedAreaPercentages": { "x": 25, "y": 10, "width": 50, "height": 80 },
      "focus": { "x": 50, "y": 50 }
    }
  }

【權限約束】
- 圖片儲存於 storage bucket，公開讀取，僅 authenticated 使用者可上傳/修改/刪除
- 上傳檔案大小限制由 storage 服務設定

【異常處理規則】
- 超過 5 張上限：toast "You can upload a maximum of 5 images" 並阻止添加
- 上傳失敗：顯示具體錯誤訊息
- new Images 的 metadata key 為 "new-{index}"，提交時自動映射為最終 URL

【輸出格式要求】
- 使用 @dnd-kit/core 和 @dnd-kit/sortable
- 建立 SortableImageItem 內部元件
- 圖片縮圖使用 aspect-square 或固定高度（h-24）
```

---

### 5.2 圖片裁剪對話框

#### 提示詞 #IMAGE-002：建立圖片裁剪與焦點調整對話框

```
【功能名稱】圖片裁剪與焦點調整（WYSIWYG）
【核心目標】提供所見即所得的圖片裁剪工具，裁剪結果與前台卡片渲染完全一致

【操作步驟】
1. 管理員點擊圖片的裁剪按鈕（⛶），打開裁剪對話框
2. 對話框佈局：
   - 頂部標題："Crop & Adjust Focus"
   - 中間：react-easy-crop 的 Cropper 元件，填滿可用空間（flex-1, min-h-[300px]）
   - 下方：Zoom 滑桿（range 0.5 ~ 3，step 0.1）
   - 底部：Cancel 和 Save Crop & Focus 按鈕
3. 裁剪區域預設為 16:9 比例（aspect={16/9}），符合前台卡片容器
4. 管理員可拖曳圖片調整位置、使用滑桿調整縮放
5. 點擊 Save，系統儲存以下參數：
   - crop: { x, y } — 圖片在視窗內的偏移
   - zoom: number — 縮放倍率
   - croppedAreaPercentages: { x, y, width, height } — 裁剪區域在圖片中的百分比位置
   - focus: { x, y } — 裁剪區域中心點（用於 object-position fallback）
6. 儲存後關閉對話框，縮圖卡片立即顯示裁剪後的效果

【裁剪數學原理】
- croppedAreaPercentages 表示所選區域佔整個圖片的百分比位置和大小
- 前台渲染時使用 absolute 定位將圖片縮放並位移，使所選區域填滿容器：
  - width: (100 / croppedAreaPercentages.width) * 100%
  - height: (100 / croppedAreaPercentages.height) * 100%
  - left: -(x / width) * 100%
  - top: -(y / height) * 100%

【權限約束】
- 裁剪操作在前端完成，參數隨文章一併儲存
- 不涉及額外的後端權限檢查

【異常處理規則】
- 圖片載入失敗：Cropper 區域顯示占位或錯誤提示
- 初次開啟無初始資料：crop 預設 {x:0, y:0}，zoom 預設 1

【輸出格式要求】
- 建置 ImageCropperDialog.tsx
- 使用 react-easy-crop 的 Cropper 元件
- 使用 Slider 元件控制 zoom
- 對話框最大寬度 max-w-3xl，高度 80vh
```

---

### 5.3 裁剪圖片前台渲染

#### 提示詞 #IMAGE-003：建立裁剪圖片渲染元件

```
【功能名稱】裁剪圖片精確渲染（CroppedImage）
【核心目標】根據 image_metadata 中的裁剪參數，在前台精確還原後台編輯時所選的裁剪範圍

【操作步驟】
1. 元件接收 props：src, alt, metadata, containerClassName, className
2. 判斷渲染模式：
   - 若 metadata.croppedAreaPercentages 存在 → 精確裁剪模式
   - 否則若 metadata.focus 存在 → 焦點模式（object-position fallback）
   - 否則 → 標準 object-cover 模式
3. 精確裁剪模式：
   - 外層容器設定 overflow-hidden + 相對定位
   - 若 containerClassName 包含 "aspect-" 前綴 → 使用該比例
   - 圖片使用 absolute 定位，根據 croppedAreaPercentages 計算尺寸和位置
4. 焦點模式：
   - 使用 object-cover 樣式 + object-position 按 focus(x%, y%)
5. 無裁剪資料模式：
   - 使用 object-cover 樣式，預設居中

【CSS 關鍵演算法】
  假定 metadata = { croppedAreaPercentages: { x: 25, y: 10, width: 50, height: 80 } }
  
  圖片 CSS：
    width: (100 / 0.50) = 200%        // 圖片放大 2 倍
    height: (100 / 0.80) = 125%       // 圖片放大 1.25 倍
    left: -(25 / 50) * 100% = -50%    // 向左偏移，使裁剪區左上對齊容器左邊
    top: -(10 / 80) * 100% = -12.5%   // 向上偏移，使裁剪區上邊對齊容器上邊
  
  效果：裁剪區域（圖片的 50%寬 × 80%高區塊）會被放大至恰好填滿外層容器

【權限約束】
- 純前端渲染元件，無權限限制

【異常處理規則】
- metadata 為 null/undefined：降級為標準 object-cover 渲染
- 圖片載入失敗：顯示 alt 文字或占位圖

【輸出格式要求】
- 建置 CroppedImage.tsx 元件
- img 標籤設定 maxWidth: 'none' 以允許超出容器
- 外層容器必須有 overflow-hidden
```

---

## 6. 模組五：發布狀態與草稿管理

#### 提示詞 #PUBLISH-001：建立文章發布狀態管理

```
【功能名稱】文章發布/草稿狀態切換
【核心目標】支援文章的草稿-發布工作流，發布時記錄時間戳

【操作步驟】
1. 文章列表每篇文章顯示當前狀態 badge：
   - published === true：綠色 default badge，顯示 "Published"
   - published === false：灰色 secondary badge，顯示 "Draft"
2. 管理員點擊 Publish/Unpublish 按鈕切換狀態：
   - 發布：SET published = true, published_at = now()
   - 取消發布：SET published = false, published_at = null
3. 表單編輯時，可使用 Switch 開關控制發布狀態
4. 新建文章可選擇「Publish immediately」或儲存為草稿

【前台顯示邏輯】
- 文章列表頁僅顯示 published = true 的文章
- 後台列表頁顯示所有文章（含草稿）
- 此邏輯透過 RLS 策略實現：
  - Published articles are publicly viewable（published = true）
  - Authenticated users can view all articles（後台用）

【權限約束】
- 僅 admin 可切換發布狀態（RLS 確保）
- 前台使用者無法看到草稿文章

【異常處理規則】
- 切換失敗：toast 顯示錯誤，狀態復原

【輸出格式要求】
- 資料庫 published 欄位為 boolean，預設 false
- published_at 為 nullable timestamp
```

---

## 7. 模組六：聯絡表單管理

#### 提示詞 #CONTACT-001：建立聯絡表單提交與管理功能

```
【功能名稱】聯絡表單提交與管理
【核心目標】前台使用者可提交聯絡表單，後台管理員可查看所有提交紀錄

【前台提交流程】
1. 使用者填寫聯絡表單：Name、Email、Subject、Message
2. 前端表單驗證：
   - Name：必填
   - Email：必填 + 正則格式驗證 /^[^\s@]+@[^\s@]+\.[^\s@]+$/
   - Subject：必填
   - Message：必填 + 最少 10 字元
3. 提交至資料庫 contact_submissions 表
4. 成功：顯示成功 toast + 清空表單
5. 失敗：顯示錯誤 toast，保留已填寫內容

【後台管理功能】（可擴展，目前為 RLS 保護的查詢權限）
1. Admin 可查看所有聯絡提交
2. 未來可擴展：標記已讀/未讀、回覆、匯出 CSV

【資料庫結構】
- 表名：contact_submissions
- 欄位：id (UUID PK), name, email, subject, message, created_at

【RLS 策略】
- INSERT：Anyone can insert (WITH CHECK true)
- SELECT：Admins can view (USING has_role(auth.uid(), 'admin'))

【權限約束】
- 前台任何人可提交（無需登入）
- 後台僅 admin 可查看

【異常處理規則】
- 表單驗證失敗：在對應欄位下方顯示紅色錯誤文字 + 邊框變為 destructive 色
- 提交失敗：toast "Failed to send message. Please try again later."

【輸出格式要求】
- 建置 Contact.tsx 頁面元件
- 使用 react-hook-form 或手動驗證
- 整合 sonner toast 通知
```

---

## 8. 模組七：預覽系統

#### 提示詞 #PREVIEW-001：建立文章卡片預覽對話框

```
【功能名稱】所見即所得文章卡片預覽
【核心目標】在發佈前以對話框形式展示文章在前台卡片中的實際呈現效果，
            包含桌面端（3 欄）、平板（2 欄）、手機（1 欄）的響應式預覽

【操作步驟】
1. 管理員在編輯表單中點擊「Preview」按鈕
2. 彈出全螢幕對話框（max-w-[1100px]，max-h-[90vh]）
3. 對話框內分三個區塊，各自標註斷點名稱：
   - Desktop (lg: 3 columns)：顯示 1 張真實卡片 + 2 張占位卡片
   - Tablet (md: 2 columns)：顯示 1 張真實卡片 + 1 張占位卡片
   - Mobile (1 column)：顯示 1 張真實卡片
4. 真實卡片渲染邏輯必須與前台文章列表完全一致，包含：
   - 與前台相同的網格間距（gap-6）
   - 與前台相同的容器寬度（max-w-[1024px] mx-auto px-4）
   - 相同的 Card 結構、陰影、hover 效果
   - 若有圖片：使用 CroppedImage + aspect-video 容器
   - 若無圖片：顯示 Calendar 占位圖示 + aspect-video 容器

【卡片內部結構】
  ┌──────────────────────┐
  │ 圖片 (aspect-video)   │
  ├──────────────────────┤
  │ 📅 日期               │
  │ 標題 (line-clamp-2)   │
  │ 摘要 (line-clamp-3)   │
  └──────────────────────┘

【權限約束】
- 預覽僅在後台編輯時可用，無需額外權限

【異常處理規則】
- 圖片為 null：顯示 aspect-video 占位容器 + Calendar 圖示
- 摘要為空：使用不換行空格（\u00A0）保持高度一致

【輸出格式要求】
- 建置 ArticlePreviewDialog.tsx 元件
- 使用 Dialog 元件
- 占位卡片使用骨架屏樣式（bg-secondary/20）
```

---

## 9. 跨站部署注意事項

### 9.1 權限校驗的兼容性配置

| 項目 | 說明 | 遷移注意事項 |
|------|------|-------------|
| RLS 策略 | 資料庫層級的安全性策略 | 需在新專案的資料庫中手動建立；確認策略名稱和邏輯一致 |
| 角色檢查函數 | `has_role(user_id, role)` SECURITY DEFINER 函數 | 需於新資料庫中建立此函數，注意 search_path 設為 public |
| user_roles 表 | 儲存使用者角色對應 | 需建立相同結構的表和 UNIQUE 約束 |
| Storage 權限 | bucket 的 INSERT/UPDATE/DELETE 策略 | 確認新專案的 storage bucket 策略與原專案一致 |

### 9.2 資料格式的統一標準

| 項目 | 標準格式 | 注意事項 |
|------|----------|----------|
| 多語言欄位命名 | `{field}_zhtw`, `{field}_zhcn` | 新專案需保持此命名約定，或修改 getLocalizedField 函數的 suffix mapping |
| image_metadata | JSONB: `{ "url": { crop, zoom, croppedAreaPercentages, focus } }` | key 必須是圖片 URL 字串 |
| image_urls | PostgreSQL text[] 陣列 | 若使用其他資料庫，需調整為 JSON 陣列或關聯表 |
| 分類枚舉 | article_category enum: 'education_research', 'news_events', 'philanthropy' | 新專案可自定義分類，但需同步修改 ArticleList 和 ArticleForm 中的類型定義 |

### 9.3 BaaS 依賴替換指南

| 原系統 | 函數 / 方法 | 替換方案 |
|--------|-------------|---------|
| Supabase Auth | `signInWithPassword`, `signOut`, `getSession`, `onAuthStateChange` | Firebase Auth、Auth0、Clerk、自建 JWT 認證 |
| Supabase Database | `.from('table').select/insert/update/delete` | 替換為 REST API 呼叫或 Prisma/Drizzle ORM |
| Supabase Storage | `.storage.from('bucket').upload/getPublicUrl` | 替換為 S3、Cloudinary、自建檔案服務 |
| Supabase RLS | Row Level Security 策略 | 在 API 層實作等價的權限校驗 Middleware |

### 9.4 安全校驗機制的遷移要求

1. **認證層**：
   - 確保新系統的 session 管理機制與原系統等效（HTTP-only cookie 或 JWT + refresh token）
   - 登入失敗次數限制（rate limiting）建議實作
   
2. **授權層**：
   - 每個 API endpoint 必須檢查使用者角色，不可僅在前端隱藏 UI
   - 使用 Middleware / Guard 模式統一處理權限校驗
   
3. **資料層**：
   - 所有 write 操作必須檢查 auth context
   - 敏感操作（刪除、角色變更）需二次確認
   
4. **檔案上傳**：
   - 限制檔案類型（僅允許 image/*）
   - 限制檔案大小（建議 5MB 以下）
   - 使用 CDN 或專用 storage service，避免直接暴露後端伺服器

### 9.5 環境變數

| 變數名稱 | 說明 | 範例 |
|----------|------|------|
| `VITE_SUPABASE_URL` | BaaS 專案 URL | `https://xxxxx.supabase.co` |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | BaaS 公開金鑰 | `eyJ...` |
| `VITE_STORAGE_BUCKET` | 圖片存儲 bucket 名稱 | `article-images` |

---

## 10. 功能驗證清單

### 10.1 認證與授權

- [ ] 訪問 `/admin` 顯示登入表單
- [ ] 輸入錯誤密碼時顯示錯誤訊息
- [ ] 輸入正確密碼後導向 `/admin/dashboard`
- [ ] 已登入使用者訪問 `/admin` 自動跳轉至 dashboard
- [ ] 非 admin 角色使用者被拒絕訪問並強制登出
- [ ] 點擊 Sign Out 按鈕正常登出並導向 `/admin`
- [ ] Session 過期後自動導向登入頁

### 10.2 文章 CRUD

- [ ] 預設顯示 Education & Research 分類的文章列表
- [ ] 切換 News & Events / Philanthropy 頁籤正確顯示對應分類文章
- [ ] 無文章時顯示空狀態提示
- [ ] 點擊 New Article 按鈕進入建立表單
- [ ] 填寫必填欄位後可成功建立文章
- [ ] 點擊 Edit 按鈕進入編輯表單，現有資料正確回填
- [ ] 修改後儲存成功，列表內容更新
- [ ] 點擊 Delete 按鈕彈出確認對話框
- [ ] 確認刪除後文章從列表消失
- [ ] 取消刪除則文章保留

### 10.3 多語言

- [ ] 表單中三個語言頁籤（EN / 繁體 / 简体）可正常切換
- [ ] 各語言頁籤內容獨立儲存，切換不遺失
- [ ] 前台切換語言後，顯示對應語言的內容
- [ ] 中文欄位為空時，前台自動 fallback 到英文

### 10.4 圖片管理

- [ ] 可上傳圖片（支援多選）
- [ ] 上傳超過 5 張時顯示限制提示
- [ ] 圖片可拖曳排序
- [ ] 圖片可刪除
- [ ] 點擊裁剪按鈕打開裁剪對話框
- [ ] 裁剪對話框支援縮放和拖曳
- [ ] 儲存裁剪後，縮圖即時更新為裁剪後效果
- [ ] 預覽中的圖片顯示與裁剪框選擇一致

### 10.5 發布管理

- [ ] Draft 文章僅在後台可見
- [ ] Published 文章在前台可見
- [ ] Publish 按鈕切換為 Unpublish（反之亦然）
- [ ] 發布時記錄 published_at 時間戳
- [ ] 表單中的 Publish immediately 開關正常運作

### 10.6 預覽功能

- [ ] 點擊 Preview 按鈕打開預覽對話框
- [ ] 桌面端預覽顯示 3 欄佈局
- [ ] 平板預覽顯示 2 欄佈局
- [ ] 手機預覽顯示 1 欄佈局
- [ ] 預覽卡片與前台實際渲染一致
- [ ] 關閉預覽返回編輯表單

### 10.7 聯絡表單

- [ ] 前台可提交聯絡表單
- [ ] 表單驗證正確攔截無效輸入
- [ ] 提交成功顯示成功提示
- [ ] 提交失敗顯示錯誤提示
- [ ] 後台 admin 可查看聯絡提交記錄

---

## 附錄 A：完整資料庫 Schema

```sql
-- 文章分類枚舉
CREATE TYPE article_category AS ENUM ('education_research', 'news_events', 'philanthropy');

-- 文章表
CREATE TABLE articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  title_zhtw TEXT,
  title_zhcn TEXT,
  slug TEXT NOT NULL UNIQUE,
  excerpt TEXT,
  excerpt_zhtw TEXT,
  excerpt_zhcn TEXT,
  content TEXT NOT NULL,
  content_zhtw TEXT,
  content_zhcn TEXT,
  category article_category NOT NULL,
  image_urls TEXT[],
  image_metadata JSONB DEFAULT '{}'::jsonb,
  published BOOLEAN NOT NULL DEFAULT false,
  published_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 使用者角色枚舉
CREATE TYPE app_role AS ENUM ('admin', 'moderator');

-- 使用者角色表
CREATE TABLE user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  UNIQUE (user_id, role)
);

-- 聯絡表單提交表
CREATE TABLE contact_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
```

---

## 附錄 B：核心工具函數

```typescript
// getLocalizedField — 多語言欄位讀取
export function getLocalizedField<T = string>(
  article: Record<string, any> | null,
  field: string,
  language: string
): T {
  if (!article) return "" as T;
  if (language === "zh-TW" && article[`${field}_zhtw`]) {
    return article[`${field}_zhtw`] as T;
  }
  if (language === "zh-CN" && article[`${field}_zhcn`]) {
    return article[`${field}_zhcn`] as T;
  }
  return (article[field] ?? "") as T;
}
```

---

> **文件結束** — 此提示詞集合覆蓋了後台管理系統的所有核心功能模組。  
> 每個提示詞均可獨立交付給 AI 輔助開發工具執行，無需依賴原專案的私有配置。
