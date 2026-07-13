const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const branch = process.env.GITHUB_REF_NAME || 'dev';
const bumpType = branch === 'main' ? 'major' : 'minor';

function getPackages(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir)
    .map(subDir => path.join(dir, subDir))
    .filter(fullPath => fs.statSync(fullPath).isDirectory() && fs.existsSync(path.join(fullPath, 'package.json')))
    .map(fullPath => {
      const pkgJson = JSON.parse(fs.readFileSync(path.join(fullPath, 'package.json'), 'utf8'));
      return pkgJson.name;
    });
}

const appsPackages = getPackages(path.resolve(__dirname, '../apps'));
const libsPackages = getPackages(path.resolve(__dirname, '../packages'));
const allPackages = [...appsPackages, ...libsPackages];

const changesetContent = `---
${allPackages.map(pkg => `"${pkg}": ${bumpType}`).join('\n')}
---

Automatic ${bumpType} release for branch ${branch}
`;

const changesetDir = path.resolve(__dirname, '../.changeset');
if (!fs.existsSync(changesetDir)) {
  fs.mkdirSync(changesetDir, { recursive: true });
}

const existingChangesets = fs.existsSync(changesetDir)
  ? fs.readdirSync(changesetDir).filter(file => file.endsWith('.md') && file !== 'README.md')
  : [];

if (existingChangesets.length > 0) {
  console.log('Existing changeset(s) found, skipping automatic generation.');
  process.exit(0);
}

const filename = `auto-release-${crypto.randomBytes(4).toString('hex')}.md`;
fs.writeFileSync(path.join(changesetDir, filename), changesetContent);

console.log(`Created changeset ${filename} with ${bumpType} bump for ${allPackages.length} packages.`);
