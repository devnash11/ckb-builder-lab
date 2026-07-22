import type { ProgressState } from "./types";

export const PROGRESS_STORAGE_KEY = "ckb-builder-lab-progress";

export function createProgress(activeChallengeId: string): ProgressState {
  return {
    completedChallengeIds: [],
    activeChallengeId,
    lastUpdatedAt: "",
  };
}

export function parseStoredProgress(
  rawProgress: string | null,
  challengeIds: string[],
  fallbackChallengeId: string,
): ProgressState {
  const fallback = createProgress(fallbackChallengeId);

  if (!rawProgress) {
    return fallback;
  }

  try {
    const parsed = JSON.parse(rawProgress) as Partial<ProgressState>;
    const completedChallengeIds = Array.isArray(parsed.completedChallengeIds)
      ? parsed.completedChallengeIds.filter(
          (id): id is string => typeof id === "string" && challengeIds.includes(id),
        )
      : [];
    const activeChallengeId =
      typeof parsed.activeChallengeId === "string" &&
      challengeIds.includes(parsed.activeChallengeId)
        ? parsed.activeChallengeId
        : fallbackChallengeId;

    return {
      completedChallengeIds: [...new Set(completedChallengeIds)],
      activeChallengeId,
      lastUpdatedAt:
        typeof parsed.lastUpdatedAt === "string" ? parsed.lastUpdatedAt : "",
    };
  } catch {
    return fallback;
  }
}
