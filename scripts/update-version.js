const fs = require('fs');
const path = require('path');

const rootPackageJsonPath = path.resolve(__dirname, '../package.json');
const rootPackageJson = JSON.parse(fs.readFileSync(rootPackageJsonPath, 'utf8'));

// Use the version from root package.json, which is managed by Changesets
const newVersion = rootPackageJson.version;
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

if (process.env.GITHUB_OUTPUT) {
  fs.appendFileSync(process.env.GITHUB_OUTPUT, `version=${newVersion}\n`);
  fs.appendFileSync(process.env.GITHUB_OUTPUT, `published=true\n`);
}
