const fs = require('fs');
const path = require('path');

function walkDir(dir) {
  const files = [];
  for (const f of fs.readdirSync(dir, {withFileTypes: true})) {
    const full = path.join(dir, f.name);
    if (f.isDirectory()) files.push(...walkDir(full));
    else if (/\.(jsx?|mjs)$/.test(f.name)) files.push(full);
  }
  return files;
}

const files = walkDir('./src');
let issues = [];

for (const file of files) {
  const code = fs.readFileSync(file, 'utf8');

  // Check for import of files that don't exist
  const importRegex = /from\s+['"](\.[^'"]+)['"]/g;
  let match;
  while ((match = importRegex.exec(code)) !== null) {
    const importPath = match[1];
    const dir = path.dirname(file);
    let resolved = path.resolve(dir, importPath);

    const exts = ['', '.js', '.jsx', '.mjs'];
    let found = false;
    for (const ext of exts) {
      if (fs.existsSync(resolved + ext)) { found = true; break; }
    }
    if (!found) {
      for (const ext of ['/index.js', '/index.jsx']) {
        if (fs.existsSync(resolved + ext)) { found = true; break; }
      }
    }
    if (!found) {
      issues.push(file + ' -> missing import: ' + importPath);
    }
  }
}

if (issues.length === 0) {
  console.log('No import issues found');
} else {
  issues.forEach(i => console.log(i));
}
