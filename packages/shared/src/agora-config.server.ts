export const agoraServerConfig = {
  appId: process.env.AGORA_APP_ID || process.env.NEXT_PUBLIC_AGORA_APP_ID!,
  appCertificate: process.env.AGORA_APP_CERTIFICATE!,
};

export function validateAgoraServerConfig() {
  if (!agoraServerConfig.appId) {
    throw new Error('AGORA_APP_ID or NEXT_PUBLIC_AGORA_APP_ID is required');
  }
  if (!agoraServerConfig.appCertificate) {
    throw new Error('AGORA_APP_CERTIFICATE is required');
  }
}
