const fs = require('fs');

const files = [
  'src/pages/NotFound.tsx',
  'src/pages/ArticleDetail.tsx',
  'src/pages/Home.tsx',
  'src/pages/Articles.tsx',
  'src/components/Navigation.tsx',
  'src/pages/Philanthropy.tsx',
  'src/components/Footer.tsx'
];

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  if (content.includes('import { Link } from "react-router-dom"')) {
    content = content.replace(
      'import { Link } from "react-router-dom"',
      'import { LocalizedLink as Link } from "@/components/LocalizedLink"'
    );
  } else if (content.includes('Link')) {
    content = content.replace(/import\s+\{([^}]*?)\bLink\b([^}]*?)\}\s+from\s+"react-router-dom"/g, (match, p1, p2) => {
      const rest = (p1 + p2).split(',').map(s => s.trim()).filter(s => s).join(', ');
      let replacement = `import { LocalizedLink as Link } from "@/components/LocalizedLink";\n`;
      if (rest) {
        replacement += `import { ${rest} } from "react-router-dom";`;
      }
      return replacement;
    });
  }
  fs.writeFileSync(file, content, 'utf8');
  console.log('Updated ' + file);
}