import { describe, expect, it } from "vitest";
import { createProgress, parseStoredProgress } from "./progress";

const challengeIds = [
  "create-first-cell",
  "execute-state-transition",
  "transfer-ownership",
];

describe("challenge progress", () => {
  it("creates empty progress for the first challenge", () => {
    expect(createProgress("create-first-cell")).toEqual({
      completedChallengeIds: [],
      activeChallengeId: "create-first-cell",
      lastUpdatedAt: "",
    });
  });

  it("keeps only known challenge IDs from stored progress", () => {
    const progress = parseStoredProgress(
      JSON.stringify({
        completedChallengeIds: [
          "create-first-cell",
          "unknown-challenge",
          "create-first-cell",
        ],
        activeChallengeId: "execute-state-transition",
        lastUpdatedAt: "2026-07-22T12:00:00.000Z",
      }),
      challengeIds,
      "create-first-cell",
    );

    expect(progress).toEqual({
      completedChallengeIds: ["create-first-cell"],
      activeChallengeId: "execute-state-transition",
      lastUpdatedAt: "2026-07-22T12:00:00.000Z",
    });
  });

  it("falls back safely when stored progress is invalid", () => {
    expect(
      parseStoredProgress("not-json", challengeIds, "create-first-cell"),
    ).toEqual(createProgress("create-first-cell"));
  });
});
