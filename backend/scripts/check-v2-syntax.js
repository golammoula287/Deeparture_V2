const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const roots = [path.join(__dirname, '..', 'src'), path.join(__dirname, '..', 'scripts')];
const files = [];
for (const root of roots) {
  const walk = (dir) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (entry.isFile() && entry.name.endsWith('.js')) files.push(full);
    }
  };
  walk(root);
}
let failed = 0;
for (const file of files) {
  const result = spawnSync(process.execPath, ['--check', file], { encoding: 'utf8' });
  if (result.status !== 0) {
    failed++;
    console.error(`Syntax error: ${path.relative(process.cwd(), file)}\n${result.stderr}`);
  }
}
if (failed) process.exit(1);
console.log(`Syntax OK: ${files.length} JavaScript files.`);
