import { validateEnv } from './env';

const env = validateEnv();

export const agoraServerConfig = {
  appId: env.NEXT_PUBLIC_AGORA_APP_ID!,
  appCertificate: env.AGORA_APP_CERTIFICATE!,
};

export function validateAgoraServerConfig() {
  if (!agoraServerConfig.appId) {
    throw new Error('NEXT_PUBLIC_AGORA_APP_ID is required');
  }
  if (!agoraServerConfig.appCertificate) {
    throw new Error('AGORA_APP_CERTIFICATE is required');
  }
}
