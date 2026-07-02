import type {
  DraftTransaction,
  LedgerState,
  SimulationResult,
} from "../simulator/types";

export type ChallengeStatus =
  | "not-started"
  | "started"
  | "submitted"
  | "passed"
  | "failed"
  | "completed";

export type ChallengeSetup = {
  ledger: LedgerState;
  draftTransaction: DraftTransaction;
};

export type ChallengeCriterion = {
  id: string;
  label: string;
  description: string;
};

export type ChallengeDefinition = {
  id: string;
  title: string;
  concept: string;
  prompt: string;
  setup: ChallengeSetup;
  successCriteria: ChallengeCriterion[];
  hints: string[];
  nextChallengeId?: string;
};

export type ChallengeMessage = {
  severity: "success" | "error" | "info";
  text: string;
};

export type ChallengeEvaluation = {
  passed: boolean;
  messages: ChallengeMessage[];
  completedCriteria: string[];
  failedCriteria: string[];
};

export type ChallengeEvaluationInput = {
  challenge: ChallengeDefinition;
  ledger: LedgerState;
  draftTransaction: DraftTransaction;
  simulationResult: SimulationResult;
};

export type ProgressState = {
  completedChallengeIds: string[];
  activeChallengeId: string;
  lastUpdatedAt: string;
};

