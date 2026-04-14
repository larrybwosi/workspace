import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, '..');

// Sync Mobile
const mobilePkgPath = path.join(rootDir, 'apps/mobile/package.json');
const mobileAppJsonPath = path.join(rootDir, 'apps/mobile/app.json');

if (fs.existsSync(mobilePkgPath) && fs.existsSync(mobileAppJsonPath)) {
  const pkg = JSON.parse(fs.readFileSync(mobilePkgPath, 'utf8'));
  const appJson = JSON.parse(fs.readFileSync(mobileAppJsonPath, 'utf8'));
  appJson.expo.version = pkg.version;
  fs.writeFileSync(mobileAppJsonPath, JSON.stringify(appJson, null, 2) + '\n');
  console.log(`Synced mobile version to ${pkg.version}`);
}

// Sync Desktop
const desktopPkgPath = path.join(rootDir, 'apps/desktop/package.json');
const tauriConfPath = path.join(rootDir, 'apps/desktop/src-tauri/tauri.conf.json');

if (fs.existsSync(desktopPkgPath) && fs.existsSync(tauriConfPath)) {
  const pkg = JSON.parse(fs.readFileSync(desktopPkgPath, 'utf8'));
  const tauriConf = JSON.parse(fs.readFileSync(tauriConfPath, 'utf8'));
  tauriConf.version = pkg.version;
  fs.writeFileSync(tauriConfPath, JSON.stringify(tauriConf, null, 2) + '\n');
  console.log(`Synced desktop version to ${pkg.version}`);
}
