const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

function replaceInFile(filePath, search, replace) {
  const content = fs.readFileSync(filePath, 'utf8');
  const result = content.replace(new RegExp(search, 'g'), replace);
  if (content !== result) {
    fs.writeFileSync(filePath, result, 'utf8');
    console.log(`Updated ${filePath}`);
  }
}

function findAndReplace(dir, search, replace, ext = '.tsx|.ts') {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      findAndReplace(fullPath, search, replace, ext);
    } else if (ext.includes(path.extname(fullPath))) {
      replaceInFile(fullPath, search, replace);
    }
  }
}

// 1. Rename zh-TW to zh-hk, zh-CN to zh-cn in all ts/tsx files
findAndReplace('./src', 'zh-TW', 'zh-hk');
findAndReplace('./src', 'zh-CN', 'zh-cn');

console.log("Renaming done.");
