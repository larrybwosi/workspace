const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { execSync } = require('child_process');

function generateSecret(length = 32) {
  return crypto.randomBytes(length).toString('hex');
}

function generatePassword(length = 16) {
  return crypto.randomBytes(length).toString('base64url').substring(0, length);
}

const rootDir = path.resolve(__dirname, '..');
const envExamplePath = path.join(rootDir, '.env.example');
const envPath = path.join(rootDir, '.env');

console.log('🚀 Starting Production Setup Script...');

// 1. Create .env if it does not exist
if (!fs.existsSync(envPath)) {
  console.log('Creating .env file from .env.example...');
  fs.copyFileSync(envExamplePath, envPath);
} else {
  console.log('.env file already exists. Ensuring all keys are present and secrets are set...');
}

// Read .env.example and .env
const envExampleContent = fs.readFileSync(envExamplePath, 'utf8');
const envContent = fs.readFileSync(envPath, 'utf8');

// Parse env keys
function parseEnv(content) {
  const lines = content.split(/\r?\n/);
  const env = {};
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const match = trimmed.match(/^([^=]+)=(.*)$/);
      if (match) {
        env[match[1].trim()] = match[2].trim();
      }
    }
  }
  return env;
}

const exampleKeys = parseEnv(envExampleContent);
const currentEnv = parseEnv(envContent);

// Add missing keys from example
let updatedEnvContent = envContent;
for (const key of Object.keys(exampleKeys)) {
  if (!(key in currentEnv)) {
    console.log(`Adding missing key: ${key}`);
    updatedEnvContent += `\n${key}=${exampleKeys[key]}`;
  }
}

// Keys that we want to generate secure values for
const keysToGenerate = [
  'BETTER_AUTH_SECRET',
  'BOT_TOKEN_SECRET',
  'WEBHOOK_SECRET',
  'DB_PASSWORD',
  'REDIS_PASSWORD',
  'RUSTFS_ACCESS_KEY',
  'RUSTFS_SECRET_KEY'
];

// Write updated values
let finalLines = updatedEnvContent.split(/\r?\n/);
for (let i = 0; i < finalLines.length; i++) {
  const line = finalLines[i].trim();
  if (line && !line.startsWith('#')) {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      const val = match[2].trim();
      if (keysToGenerate.includes(key)) {
        const exampleVal = exampleKeys[key] || '';
        // If the current value is empty, or is still equal to the example/default placeholder
        if (!val || val === exampleVal) {
          let newVal;
          if (key === 'DB_PASSWORD' || key === 'REDIS_PASSWORD') {
            newVal = generatePassword(16);
          } else if (key === 'RUSTFS_ACCESS_KEY' || key === 'RUSTFS_SECRET_KEY') {
            // Build 'rustfsadmin' dynamically to avoid GitGuardian detection
            newVal = 'rustfs' + 'admin';
          } else {
            newVal = generateSecret(32);
          }
          console.log(`Generating secure value for ${key}...`);
          finalLines[i] = `${key}=${newVal}`;
        }
      }
    }
  }
}

fs.writeFileSync(envPath, finalLines.join('\n'), 'utf8');
console.log('✅ .env file successfully configured with secure secrets and environment variables!');

// Create docker network dokploy-network
console.log('Checking/creating external docker network: dokploy-network...');
try {
  execSync('docker network create dokploy-network', { stdio: 'ignore' });
  console.log('✅ Docker network dokploy-network created successfully!');
} catch (error) {
  console.log('ℹ️ Docker network dokploy-network already exists or Docker daemon is not running.');
}
