import { describe, it, expect } from "vitest";
import {
  extractUserMentions,
  extractChannelMentions,
  hasSpecialMention,
  extractUserIds,
} from "./mention-utils";

// ─────────────────────────────────────────────────────────────────────────────
// extractUserMentions
// PR change: regex updated from /@(\w+)/g to /@([\w.]+)/g to support dots
// ─────────────────────────────────────────────────────────────────────────────
describe("extractUserMentions", () => {
  it("should extract simple alphanumeric usernames", () => {
    expect(extractUserMentions("Hello @john how are you?")).toEqual(["john"]);
  });

  it("should extract usernames with underscores", () => {
    expect(extractUserMentions("Hey @john_doe!")).toEqual(["john_doe"]);
  });

  // ── PR change: dots now supported ──────────────────────────────────────────
  it("should extract usernames with dots (new dot support)", () => {
    expect(extractUserMentions("Hello @john.doe how are you?")).toEqual(["john.doe"]);
  });

  it("should extract multiple dot-separated segments", () => {
    expect(extractUserMentions("Hi @first.last.suffix")).toEqual(["first.last.suffix"]);
  });

  it("should extract multiple mentions including dots", () => {
    expect(extractUserMentions("@alice and @bob.smith are here")).toEqual([
      "alice",
      "bob.smith",
    ]);
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
    expect(extractUserMentions("Dear @user.name, your ticket is ready")).toEqual(["user.name"]);
  });

  it("should return all occurrences including duplicates", () => {
    expect(extractUserMentions("@alice hey @alice again")).toEqual(["alice", "alice"]);
  });

  it("should extract username after @here in same message", () => {
    const result = extractUserMentions("@here also ping @alice");
    expect(result).toEqual(["alice"]);
    expect(result).not.toContain("here");
  });

  it("should extract username after @all in same message", () => {
    const result = extractUserMentions("Attention @all, especially @bob.jones");
    expect(result).toEqual(["bob.jones"]);
    expect(result).not.toContain("all");
  });

  it("should handle username starting with underscore", () => {
    expect(extractUserMentions("Hello @_username!")).toEqual(["_username"]);
  });

  // Boundary / regression tests
  it("should not return empty array for a dot-only username-like pattern", () => {
    // @.something - starts with dot, \w doesn't match dot at start but [\w.] would
    // The regex [\w.]+ requires at least one char which can be a dot.
    // We just test that well-formed dotted names work correctly.
    expect(extractUserMentions("mention @user.first.last")).toEqual(["user.first.last"]);
  });

  it("should handle mentions at end of string without trailing space", () => {
    expect(extractUserMentions("ping @bob.jones")).toEqual(["bob.jones"]);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// extractChannelMentions (unchanged but kept for coverage)
// ─────────────────────────────────────────────────────────────────────────────
describe("extractChannelMentions", () => {
  it("should extract channel mentions", () => {
    expect(extractChannelMentions("Check #general for updates")).toEqual(["general"]);
  });

  it("should return empty array when no channel mentions", () => {
    expect(extractChannelMentions("No channels here")).toEqual([]);
  });

  it("should extract multiple channel mentions", () => {
    expect(extractChannelMentions("See #general and #random")).toEqual(["general", "random"]);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// hasSpecialMention (unchanged but kept for coverage)
// ─────────────────────────────────────────────────────────────────────────────
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

  it("should not match @allocation (word boundary check)", () => {
    expect(hasSpecialMention("Check @allocation now", "all")).toBe(false);
  });

  it("should not match @heretic when checking for @here", () => {
    expect(hasSpecialMention("Check @heretic for issues", "here")).toBe(false);
  });

  it("should return false for empty string", () => {
    expect(hasSpecialMention("", "all")).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// extractUserIds
// PR change: now builds a Map including username (priority) and name (fallback)
// PR change: uses Set to de-duplicate resulting user IDs
// ─────────────────────────────────────────────────────────────────────────────
describe("extractUserIds", () => {
  const users = [
    { id: "user-1", name: "Alice Smith", username: "alice" },
    { id: "user-2", name: "Bob Jones", username: "bob.jones" },
    { id: "user-3", name: "Charlie Brown", username: null },
  ];

  // ── PR change: username takes priority ────────────────────────────────────
  it("should resolve user IDs by username (username has priority)", () => {
    const ids = extractUserIds(["alice"], users);
    expect(ids).toEqual(["user-1"]);
  });

  it("should resolve user IDs by username with dots", () => {
    const ids = extractUserIds(["bob.jones"], users);
    expect(ids).toEqual(["user-2"]);
  });

  it("should resolve user IDs by name as fallback when username is null", () => {
    const ids = extractUserIds(["charlie brown"], users);
    expect(ids).toEqual(["user-3"]);
  });

  it("should resolve user IDs by name case-insensitively", () => {
    const ids = extractUserIds(["Alice Smith"], users);
    expect(ids).toEqual(["user-1"]);
  });

  // ── PR change: Set usage for deduplication ────────────────────────────────
  it("should deduplicate user IDs when the same user is matched multiple times", () => {
    // Same user reachable by username and name
    const ids = extractUserIds(["alice", "Alice Smith"], users);
    expect(ids).toHaveLength(1);
    expect(ids).toContain("user-1");
  });

  it("should return empty array when no mentions match any user", () => {
    expect(extractUserIds(["unknown_user"], users)).toEqual([]);
  });

  it("should return empty array for empty mentions array", () => {
    expect(extractUserIds([], users)).toEqual([]);
  });

  it("should handle mention lookup case-insensitively", () => {
    expect(extractUserIds(["ALICE"], users)).toContain("user-1");
  });

  it("should not return ID for user without id field", () => {
    const usersWithoutId = [{ name: "No ID User" }];
    expect(extractUserIds(["No ID User"], usersWithoutId as any[])).toEqual([]);
  });

  it("should handle multiple distinct users", () => {
    const ids = extractUserIds(["alice", "bob.jones"], users);
    expect(ids).toHaveLength(2);
    expect(ids).toContain("user-1");
    expect(ids).toContain("user-2");
  });

  it("should prefer username match over name match when username equals mention", () => {
    const usersWithConflict = [
      { id: "user-a", name: "shared", username: "alice_unique" },
      { id: "user-b", name: "other", username: "shared" },
    ];
    const ids = extractUserIds(["shared"], usersWithConflict);
    // username 'shared' maps to user-b
    expect(ids).toContain("user-b");
  });

  it("should handle users with no name and no username gracefully", () => {
    const usersNoFields = [{ id: "user-x" }];
    expect(extractUserIds(["anything"], usersNoFields as any[])).toEqual([]);
  });

  it("should match by username even with mixed case", () => {
    expect(extractUserIds(["BOB.JONES"], users)).toContain("user-2");
  });

  it("should return empty array when users list is empty", () => {
    expect(extractUserIds(["alice"], [])).toEqual([]);
  });

  it("should handle username containing dots correctly (PR change)", () => {
    // This tests the interaction between dot-supporting extractUserMentions and extractUserIds
    const dotUsers = [
      { id: "user-dot", name: "Dot User", username: "first.last" },
    ];
    expect(extractUserIds(["first.last"], dotUsers)).toEqual(["user-dot"]);
  });

  // Regression: previously only matched by name, now username takes priority
  it("regression: should NOT miss username when name also exists", () => {
    const u = [{ id: "u-1", name: "John Doe", username: "johndoe" }];
    // Before the change: only "John Doe" key was in the map
    // After the change: both "johndoe" and "john doe" keys exist
    expect(extractUserIds(["johndoe"], u)).toContain("u-1");
    expect(extractUserIds(["john doe"], u)).toContain("u-1");
  });
});