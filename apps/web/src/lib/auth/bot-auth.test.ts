import { generateBotToken, validateBotToken } from "./bot-auth";

describe("Bot Authentication Utilities", () => {
  const userId = "user_123456";

  it("should generate a valid Discord-style token", () => {
    const token = generateBotToken(userId);
    expect(token).toBeDefined();
    expect(token.split(".").length).toBe(3);
  });

  it("should validate a correct token and return the userId", () => {
    const token = generateBotToken(userId);
    const validatedUserId = validateBotToken(token);
    expect(validatedUserId).toBe(userId);
  });

  it("should return null for an invalid token", () => {
    const invalidToken = "invalid.token.structure";
    expect(validateBotToken(invalidToken)).toBeNull();
  });

  it("should return null for a token with incorrect signature", () => {
    const token = generateBotToken(userId);
    const tamperedToken = token.substring(0, token.lastIndexOf(".") + 1) + "tampered_signature";
    expect(validateBotToken(tamperedToken)).toBeNull();
  });
});
