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

// Dynamically use the larger of the root version vs sub-package version.
// This ensures that when Changesets runs on main (which only bumps workspace packages),
// the root package.json version is correctly synchronized, and downstream release steps trigger.
let newVersion = rootPackageJson.version;
if (apiVersion && semverCompare(apiVersion, newVersion) > 0) {
  console.log(`Detecting newer sub-package version (apps/api): ${apiVersion} > root version: ${newVersion}`);
  newVersion = apiVersion;
  rootPackageJson.version = newVersion;
  fs.writeFileSync(rootPackageJsonPath, JSON.stringify(rootPackageJson, null, 2) + '\n');
  console.log(`Successfully updated root package.json version to ${newVersion}`);
}

// Tauri 2 requires a 3-part SemVer string for its config.
const semverVersion = newVersion;

console.log(`Syncing version ${newVersion} to non-package configuration files`);

function updateJsonFile(filePath, updateFn) {
  if (fs.existsSync(filePath)) {
    try {
      const content = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      updateFn(content);
      fs.writeFileSync(filePath, JSON.stringify(content, null, 2) + '\n');
      console.log(`Updated ${filePath}`);
    } catch (e) {
      console.error(`Failed to update ${filePath}: ${e.message}`);
    }
  }
}

const appsDir = path.resolve(__dirname, '..', 'apps');

if (fs.existsSync(appsDir)) {
    fs.readdirSync(appsDir).forEach(subDir => {
      const appPath = path.join(appsDir, subDir);

      if (subDir === 'desktop') {
        const tauriPath = path.join(appPath, 'src-tauri', 'tauri.conf.json');
        updateJsonFile(tauriPath, (json) => {
          json.version = semverVersion;
        });

        const cargoPath = path.join(appPath, 'src-tauri', 'Cargo.toml');
        if (fs.existsSync(cargoPath)) {
            let cargoContent = fs.readFileSync(cargoPath, 'utf8');
            cargoContent = cargoContent.replace(/^version = \".*\"/m, `version = "${semverVersion}"`);
            fs.writeFileSync(cargoPath, cargoContent);
            console.log(`Updated ${cargoPath}`);
        }
      }

      if (subDir === 'android') {
        const buildGradlePath = path.join(appPath, 'app', 'build.gradle.kts');
        if (fs.existsSync(buildGradlePath)) {
            let content = fs.readFileSync(buildGradlePath, 'utf8');
            content = content.replace(/versionName = \".*\"/g, `versionName = "${newVersion}"`);
            // Optionally update versionCode if you can derive it, otherwise leave as is or increment.
            // For now, just syncing versionName.
            fs.writeFileSync(buildGradlePath, content);
            console.log(`Updated ${buildGradlePath}`);
        }
      }
    });
}

// Sync version to packages/sdk/package.json
const sdkPackageJsonPath = path.resolve(__dirname, '../packages/sdk/package.json');
updateJsonFile(sdkPackageJsonPath, (json) => {
  json.version = newVersion;
});

if (process.env.GITHUB_OUTPUT) {
  fs.appendFileSync(process.env.GITHUB_OUTPUT, `version=${newVersion}\n`);
  fs.appendFileSync(process.env.GITHUB_OUTPUT, `published=true\n`);
}
