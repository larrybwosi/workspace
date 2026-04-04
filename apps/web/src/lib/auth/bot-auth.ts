import crypto from "crypto";

/**
 * Generates a Discord-style bot token: [Base64 ID].[Timestamp].[Signature]
 * @param userId The ID of the bot user
 * @returns A string representing the bot token
 */
export function generateBotToken(userId: string): string {
  const base64Id = Buffer.from(userId).toString("base64").replace(/=/g, "");
  const timestamp = Math.floor(Date.now() / 1000).toString(16);

  // Signature of base64Id + timestamp
  const signature = crypto
    .createHmac("sha256", process.env.BOT_TOKEN_SECRET || "default_secret")
    .update(`${base64Id}.${timestamp}`)
    .digest("base64url");

  return `${base64Id}.${timestamp}.${signature}`;
}

/**
 * Validates a bot token and extracts the userId
 * @param token The bot token to validate
 * @returns The userId if valid, null otherwise
 */
export function validateBotToken(token: string): string | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;

    const [base64Id, timestamp, signature] = parts;

    // Verify signature
    const expectedSignature = crypto
      .createHmac("sha256", process.env.BOT_TOKEN_SECRET || "default_secret")
      .update(`${base64Id}.${timestamp}`)
      .digest("base64url");

    if (signature !== expectedSignature) return null;

    // Extract user ID
    const userId = Buffer.from(base64Id, "base64").toString("utf-8");
    return userId;
  } catch (error) {
    console.error("Error validating bot token:", error);
    return null;
  }
}
