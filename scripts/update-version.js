const fs = require('fs');
const path = require('path');

const buildNumber = process.env.GITHUB_RUN_NUMBER || '0';
const rootPackageJsonPath = path.resolve(__dirname, '../package.json');
const rootPackageJson = JSON.parse(fs.readFileSync(rootPackageJsonPath, 'utf8'));

const versionParts = rootPackageJson.version.split('.');
const major = versionParts[0] || '0';
const minor = versionParts[1] || '0';
const patch = versionParts[2] || '0';

// MSI version requirements: major.minor.patch.build where each is numeric.
const newVersion = "0.1.346";
// Tauri 2 requires a 3-part SemVer string for its config.
const semverVersion = `${major}.${minor}.${patch}`;

console.log(`Updating version from ${rootPackageJson.version} to ${newVersion} (SemVer: ${semverVersion})`);

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

updateJsonFile(rootPackageJsonPath, (json) => {
  json.version = newVersion;
});

const directories = ['apps', 'packages'];
directories.forEach(dir => {
  const fullDir = path.resolve(__dirname, '..', dir);
  if (fs.existsSync(fullDir)) {
    fs.readdirSync(fullDir).forEach(subDir => {
      const pkgPath = path.join(fullDir, subDir, 'package.json');
      updateJsonFile(pkgPath, (json) => {
        json.version = newVersion;
      });

      if (subDir === 'desktop') {
        const tauriPath = path.join(fullDir, subDir, 'src-tauri', 'tauri.conf.json');
        updateJsonFile(tauriPath, (json) => {
          json.version = semverVersion;
        });

        const cargoPath = path.join(fullDir, subDir, 'src-tauri', 'Cargo.toml');
        if (fs.existsSync(cargoPath)) {
            let cargoContent = fs.readFileSync(cargoPath, 'utf8');
            cargoContent = cargoContent.replace(/^version = \".*\"/m, `version = "${semverVersion}"`);
            fs.writeFileSync(cargoPath, cargoContent);
            console.log(`Updated ${cargoPath}`);
        }
      }

      if (subDir === 'mobile') {
        const appJsonPath = path.join(fullDir, subDir, 'app.json');
        updateJsonFile(appJsonPath, (json) => {
          if (json.expo) {
            json.expo.version = newVersion;
            if (json.expo.android) {
                json.expo.android.versionCode = parseInt(buildNumber) || 1;
            }
          }
        });
      }
    });
  }
});

if (process.env.GITHUB_OUTPUT) {
  fs.appendFileSync(process.env.GITHUB_OUTPUT, `version=${newVersion}\n`);
  fs.appendFileSync(process.env.GITHUB_OUTPUT, `published=true\n`);
}
