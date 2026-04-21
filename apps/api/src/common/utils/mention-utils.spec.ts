import { describe, it, expect } from "vitest";
import {
  extractUserMentions,
  extractChannelMentions,
  hasSpecialMention,
  extractUserIds,
} from "./mention-utils";

describe("extractUserMentions", () => {
  it("should extract simple alphanumeric usernames", () => {
    expect(extractUserMentions("Hello @john how are you?")).toEqual(["john"]);
  });

  it("should extract usernames with underscores", () => {
    expect(extractUserMentions("Hey @john_doe!")).toEqual(["john_doe"]);
  });

  it("should extract usernames with dots (PR change: new [\\.] support)", () => {
    expect(extractUserMentions("Hello @john.doe how are you?")).toEqual([
      "john.doe",
    ]);
  });

  it("should extract multiple mentions", () => {
    expect(
      extractUserMentions("@alice and @bob.smith are here")
    ).toEqual(["alice", "bob.smith"]);
  });

  it("should exclude @all special mention", () => {
    expect(extractUserMentions("Hey @all check this out")).toEqual([]);
  });

  it("should exclude @here special mention", () => {
    expect(extractUserMentions("Hey @here check this out")).toEqual([]);
  });

  it("should return empty array when no mentions found", () => {
    expect(extractUserMentions("No mentions here")).toEqual([]);
  });

  it("should return empty array for empty string", () => {
    expect(extractUserMentions("")).toEqual([]);
  });

  it("should handle mixed special and regular mentions", () => {
    const result = extractUserMentions("@all look at this @john.doe please");
    expect(result).toEqual(["john.doe"]);
    expect(result).not.toContain("all");
  });

  it("should extract mentions embedded in sentences", () => {
    const result = extractUserMentions("Dear @user.name, your ticket is ready");
    expect(result).toEqual(["user.name"]);
  });

  it("should deduplicate if same username mentioned twice", () => {
    // extractUserMentions returns all occurrences (dedup is in extractUserIds)
    const result = extractUserMentions("@alice hey @alice again");
    expect(result).toEqual(["alice", "alice"]);
  });
});

describe("extractChannelMentions", () => {
  it("should extract channel mentions", () => {
    expect(extractChannelMentions("Check #general for updates")).toEqual([
      "general",
    ]);
  });

  it("should return empty array when no channel mentions", () => {
    expect(extractChannelMentions("No channels here")).toEqual([]);
  });
});

describe("hasSpecialMention", () => {
  it("should return true when @all is present", () => {
    expect(hasSpecialMention("Hey @all check this", "all")).toBe(true);
  });

  it("should return true when @here is present", () => {
    expect(hasSpecialMention("Hey @here check this", "here")).toBe(true);
  });

  it("should return false when @all is not present", () => {
    expect(hasSpecialMention("Hey @john check this", "all")).toBe(false);
  });

  it("should not match partial words like @allocation", () => {
    // The regex uses \b word boundary so @allocation should NOT match @all
    expect(hasSpecialMention("Check @allocation now", "all")).toBe(false);
  });
});

describe("extractUserIds", () => {
  const users = [
    { id: "user-1", name: "Alice Smith", username: "alice" },
    { id: "user-2", name: "Bob Jones", username: "bob.jones" },
    { id: "user-3", name: "Charlie Brown", username: null },
  ];

  it("should resolve user IDs by username (PR change: username priority)", () => {
    const ids = extractUserIds(["alice"], users);
    expect(ids).toEqual(["user-1"]);
  });

  it("should resolve user IDs by username with dots", () => {
    const ids = extractUserIds(["bob.jones"], users);
    expect(ids).toEqual(["user-2"]);
  });

  it("should resolve user IDs by name as fallback when no username", () => {
    const ids = extractUserIds(["charlie brown"], users);
    expect(ids).toEqual(["user-3"]);
  });

  it("should resolve user IDs by name as fallback (case insensitive)", () => {
    const ids = extractUserIds(["Alice Smith"], users);
    expect(ids).toEqual(["user-1"]);
  });

  it("should deduplicate user IDs (PR change: Set usage)", () => {
    // Same user mentioned by both username and name
    const ids = extractUserIds(["alice", "Alice Smith"], users);
    expect(ids).toHaveLength(1);
    expect(ids).toEqual(["user-1"]);
  });

  it("should return empty array when no mentions match any user", () => {
    const ids = extractUserIds(["unknown_user"], users);
    expect(ids).toEqual([]);
  });

  it("should return empty array for empty mentions array", () => {
    const ids = extractUserIds([], users);
    expect(ids).toEqual([]);
  });

  it("should handle mention lookup case-insensitively", () => {
    const ids = extractUserIds(["ALICE"], users);
    expect(ids).toEqual(["user-1"]);
  });

  it("should not return ID for user without id field", () => {
    const usersWithoutId = [{ name: "No ID User" }];
    const ids = extractUserIds(["No ID User"], usersWithoutId as any[]);
    expect(ids).toEqual([]);
  });

  it("should handle multiple distinct users", () => {
    const ids = extractUserIds(["alice", "bob.jones"], users);
    expect(ids).toHaveLength(2);
    expect(ids).toContain("user-1");
    expect(ids).toContain("user-2");
  });

  it("should prefer username over name when both match different users", () => {
    // Ensure username takes precedence in the map
    const usersWithConflict = [
      { id: "user-a", name: "shared", username: "alice_unique" },
      { id: "user-b", name: "other", username: "shared" },
    ];
    const ids = extractUserIds(["shared"], usersWithConflict);
    // 'shared' matches user-b's username and user-a's name
    // Both are inserted but username lookup is prioritized because username is set first
    // The map will have "shared" → user-b's id since it overwrites user-a's name entry
    expect(ids).toContain("user-b");
  });
});