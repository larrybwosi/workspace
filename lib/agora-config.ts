export const agoraConfig = {
  appId: process.env.NEXT_PUBLIC_AGORA_APP_ID!,
  appCertificate: process.env.AGORA_APP_CERTIFICATE!,
}

export function validateAgoraConfig() {
  if (!agoraConfig.appId) {
    throw new Error('NEXT_PUBLIC_AGORA_APP_ID is required')
  }
  if (!agoraConfig.appCertificate) {
    throw new Error('AGORA_APP_CERTIFICATE is required')
  }
}
