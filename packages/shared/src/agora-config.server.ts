import { validateEnv } from './env';

const env = validateEnv();

export const agoraServerConfig = {
  appId: env.AGORA_APP_ID,
  appCertificate: env.AGORA_APP_CERTIFICATE,
};
