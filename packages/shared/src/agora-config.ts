export const agoraConfig = {
  appId: process.env.NEXT_PUBLIC_AGORA_APP_ID || process.env.AGORA_APP_ID!,
};

export function validateAgoraConfig() {
  if (!agoraConfig.appId) {
    throw new Error('AGORA_APP_ID or NEXT_PUBLIC_AGORA_APP_ID is required');
  }
}
