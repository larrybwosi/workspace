const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const rootPackageJsonPath = path.resolve(__dirname, '../package.json');
const rootPackageJson = JSON.parse(fs.readFileSync(rootPackageJsonPath, 'utf8'));

function parseSemVer(v) {
  const parts = v.split('-');
  const numeric = parts[0].split('.').map(Number);
  return { numeric, prerelease: parts[1] || '' };
}

function semverCompare(a, b) {
  const pa = parseSemVer(a);
  const pb = parseSemVer(b);
  for (let i = 0; i < 3; i++) {
    const na = pa.numeric[i] || 0;
    const nb = pb.numeric[i] || 0;
    if (na !== nb) {
      return na - nb;
    }
  }
  if (pa.prerelease && !pb.prerelease) return -1;
  if (!pa.prerelease && pb.prerelease) return 1;
  if (pa.prerelease && pb.prerelease) {
    return pa.prerelease.localeCompare(pb.prerelease);
  }
  return 0;
}

let currentVersion = rootPackageJson.version;

// Dynamically use the larger of the root version vs sub-package version before uniqueness checks.
const apiPackageJsonPath = path.resolve(__dirname, '../apps/api/package.json');
let apiVersion = null;
if (fs.existsSync(apiPackageJsonPath)) {
  try {
    const apiPackageJson = JSON.parse(fs.readFileSync(apiPackageJsonPath, 'utf8'));
    apiVersion = apiPackageJson.version;
  } catch (e) {
    console.error(`Failed to read apps/api/package.json: ${e.message}`);
  }
}

let modified = false;

if (apiVersion && semverCompare(apiVersion, currentVersion) > 0) {
  console.log(`Detecting newer sub-package version (apps/api): ${apiVersion} > root version: ${currentVersion}`);
  currentVersion = apiVersion;
  modified = true;
}

console.log(`Checking uniqueness of version: ${currentVersion}`);

function tagExists(version) {
  try {
    const stdout = execSync(`git tag -l "v${version}"`, { encoding: 'utf8' }).trim();
    // Check if the returned string matches our tag exactly or if it contains it (split by newlines)
    const lines = stdout.split('\n').map(l => l.trim());
    return lines.includes(`v${version}`);
  } catch (err) {
    console.warn(`Warning: Failed to query git tags: ${err.message}`);
    return false;
  }
}

let attempts = 0;

while (tagExists(currentVersion)) {
  attempts++;
  modified = true;
  console.log(`Git tag "v${currentVersion}" already exists.`);

  // Parse and increment patch version
  const match = currentVersion.match(/^(\d+)\.(\d+)\.(\d+)(.*)$/);
  if (match) {
    const major = parseInt(match[1], 10);
    const minor = parseInt(match[2], 10);
    const patch = parseInt(match[3], 10);
    const rest = match[4];
    currentVersion = `${major}.${minor}.${patch + 1}${rest}`;
    console.log(`Trying next version: ${currentVersion}`);
  } else {
    // Fallback if not matching standard semver format
    currentVersion = `${currentVersion}-${attempts}`;
    console.log(`Trying fallback version: ${currentVersion}`);
  }
}

if (modified) {
  console.log(`Found unique available version: ${currentVersion}`);
  rootPackageJson.version = currentVersion;
  fs.writeFileSync(rootPackageJsonPath, JSON.stringify(rootPackageJson, null, 2) + '\n');
  console.log(`Successfully updated package.json version to ${currentVersion}`);
} else {
  console.log(`Version ${currentVersion} is already unique! No tag exists.`);
}
