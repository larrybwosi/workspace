import { validateEnv } from './env';

const env = validateEnv();

export const agoraConfig = {
  appId: env.NEXT_PUBLIC_AGORA_APP_ID!,
};

export function validateAgoraConfig() {
  if (!agoraConfig.appId) {
    throw new Error('NEXT_PUBLIC_AGORA_APP_ID is required');
  }
}
