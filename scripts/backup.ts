/**
 * Supabase 資料備份腳本
 * 用法: npx tsx scripts/backup.ts
 *
 * 備份內容:
 *   - articles 表（所有已發布和未發布的文章）
 *   - contact_submissions 表（聯絡表單提交記錄）
 *   - user_roles 表（用戶角色）
 *   - article-images bucket 中的圖片
 *
 * 備份輸出: backups/YYYY-MM-DD_HHmmss/
 */

import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";
import https from "https";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ============================================================
// 從 .env 檔案讀取設定（需要 VITE_SUPABASE_URL 和 VITE_SUPABASE_PUBLISHABLE_KEY）
// ============================================================
function loadEnv(): Record<string, string> {
  const envPath = path.resolve(__dirname, "..", ".env");
  const env: Record<string, string> = {};

  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, "utf-8");
    for (const line of content.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eqIndex = trimmed.indexOf("=");
      if (eqIndex === -1) continue;
      const key = trimmed.slice(0, eqIndex).trim();
      // 移除值的引號（雙引號或單引號）
      let value = trimmed.slice(eqIndex + 1).trim();
      if ((value.startsWith('"') && value.endsWith('"')) ||
          (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      env[key] = value;
    }
  }

  return env;
}

// ============================================================
// 下載單個檔案
// ============================================================
function downloadFile(url: string, destPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const dir = path.dirname(destPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    const file = fs.createWriteStream(destPath);
    https
      .get(url, (response) => {
        // 處理重新導向
        if (response.statusCode && response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
          file.close();
          fs.unlinkSync(destPath);
          downloadFile(response.headers.location, destPath).then(resolve).catch(reject);
          return;
        }

        response.pipe(file);
        file.on("finish", () => {
          file.close();
          resolve();
        });
      })
      .on("error", (err) => {
        fs.unlink(destPath, () => {});
        reject(err);
      });
  });
}

// ============================================================
// 主備份流程
// ============================================================
async function backup() {
  console.log("=== FOIHK Supabase 資料備份 ===\n");

  // 1. 載入環境變數
  const env = loadEnv();
  const SUPABASE_URL = env.VITE_SUPABASE_URL;
  const SUPABASE_KEY = env.VITE_SUPABASE_PUBLISHABLE_KEY;

  if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error("❌ 找不到環境變數！請確認 .env 檔案中有 VITE_SUPABASE_URL 和 VITE_SUPABASE_PUBLISHABLE_KEY");
    process.exit(1);
  }

  // 2. 建立備份目錄
  const timestamp = new Date()
    .toISOString()
    .replace(/[:.]/g, "-")
    .slice(0, 19)
    .replace("T", "_");
  const backupDir = path.resolve(__dirname, "..", "backups", timestamp);
  const dataDir = path.join(backupDir, "data");
  const imagesDir = path.join(backupDir, "images");

  fs.mkdirSync(dataDir, { recursive: true });
  console.log(`📁 備份目錄: ${backupDir}\n`);

  // 3. 連線 Supabase
  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
  console.log("🔗 已連線到 Supabase\n");

  // 4. 備份 articles 表
  console.log("📄 匯出 articles 表...");
  const { data: articles, error: articlesError } = await supabase
    .from("articles")
    .select("*")
    .order("created_at", { ascending: false });

  if (articlesError) {
    console.error(`❌ articles 表匯出失敗: ${articlesError.message}`);
  } else {
    const articleCount = articles?.length ?? 0;
    console.log(`   ✅ 已匯出 ${articleCount} 篇文章`);
    if (articleCount > 0) {
      fs.writeFileSync(
        path.join(dataDir, "articles.json"),
        JSON.stringify(articles, null, 2)
      );
      console.log(`   📁 已儲存到 data/articles.json`);

      // 顯示文章摘要
      for (const article of articles) {
        console.log(
          `      - [${article.category}] ${article.title} (${
            article.published ? "已發布" : "草稿"
          })`
        );
      }
    }
  }

  // 5. 備份 contact_submissions 表
  console.log("\n📄 匯出 contact_submissions 表...");
  const { data: contacts, error: contactsError } = await supabase
    .from("contact_submissions")
    .select("*")
    .order("created_at", { ascending: false });

  if (contactsError) {
    console.error(`❌ contact_submissions 表匯出失敗: ${contactsError.message}`);
  } else {
    const contactCount = contacts?.length ?? 0;
    console.log(`   ✅ 已匯出 ${contactCount} 筆聯絡記錄`);
    if (contactCount > 0) {
      fs.writeFileSync(
        path.join(dataDir, "contact_submissions.json"),
        JSON.stringify(contacts, null, 2)
      );
      console.log(`   📁 已儲存到 data/contact_submissions.json`);
    }
  }

  // 6. 備份 user_roles 表
  console.log("\n📄 匯出 user_roles 表...");
  const { data: roles, error: rolesError } = await supabase
    .from("user_roles")
    .select("*");

  if (rolesError) {
    console.error(`❌ user_roles 表匯出失敗: ${rolesError.message}`);
  } else {
    const roleCount = roles?.length ?? 0;
    console.log(`   ✅ 已匯出 ${roleCount} 筆用戶角色`);
    if (roleCount > 0) {
      fs.writeFileSync(
        path.join(dataDir, "user_roles.json"),
        JSON.stringify(roles, null, 2)
      );
      console.log(`   📁 已儲存到 data/user_roles.json`);
    }
  }

  // 7. 下載圖片
  console.log("\n📷 下載文章圖片...");
  if (articles && articles.length > 0) {
    fs.mkdirSync(imagesDir, { recursive: true });
    let downloadedCount = 0;
    let failedCount = 0;

    for (const article of articles) {
      if (!article.image_urls || article.image_urls.length === 0) continue;

      for (let i = 0; i < article.image_urls.length; i++) {
        const url = article.image_urls[i];
        const ext = url.split(".").pop()?.split("?")[0] || "jpg";
        const fileName = `${article.id}_${i + 1}.${ext}`;
        const destPath = path.join(imagesDir, fileName);

        try {
          await downloadFile(url, destPath);
          downloadedCount++;
        } catch (err) {
          failedCount++;
          console.log(`   ⚠️ 下載失敗: ${fileName}`);
        }
      }
    }

    console.log(
      `   ✅ ${downloadedCount} 張圖片已下載` +
        (failedCount > 0 ? `, ⚠️ ${failedCount} 張失敗` : "")
    );
  }

  // 8. 產生備份摘要
  const summary = {
    backup_time: new Date().toISOString(),
    supabase_url: SUPABASE_URL,
    tables: {
      articles: articles?.length ?? 0,
      contact_submissions: contacts?.length ?? 0,
      user_roles: roles?.length ?? 0,
    },
  };

  fs.writeFileSync(
    path.join(backupDir, "backup_summary.json"),
    JSON.stringify(summary, null, 2)
  );

  console.log("\n=== 備份完成 ====");
  console.log(`📁 備份位置: ${backupDir}`);
  console.log(`📊 備份摘要: backup_summary.json`);
}

backup().catch((err) => {
  console.error("❌ 備份失敗:", err);
  process.exit(1);
});
