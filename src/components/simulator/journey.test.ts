import { describe, expect, it } from "vitest";
import { initialChallenges } from "../../content/initial-challenges";
import { simulateTransaction } from "../../simulator";
import {
  deriveJourneyStages,
  evaluateJourneyPrediction,
  getCreatedCells,
} from "./journey";

function simulateStateTransition(withWitness = true) {
  const challenge = initialChallenges[1];
  return simulateTransaction({
    mode: "transaction",
    ledger: challenge.setup.ledger,
    transaction: {
      ...challenge.setup.draftTransaction,
      witnesses: withWitness ? challenge.setup.draftTransaction.witnesses : [],
    },
    idFactory: () => "journey-output-cell",
  });
}

describe("Cell Journey", () => {
  it("keeps every checkpoint pending before simulation", () => {
    expect(deriveJourneyStages(null).map((stage) => stage.status)).toEqual([
      "pending",
      "pending",
      "pending",
      "pending",
      "pending",
    ]);
  });

  it("marks every checkpoint successful for a valid transition", () => {
    const result = simulateStateTransition();

    expect(deriveJourneyStages(result).map((stage) => stage.status)).toEqual([
      "success",
      "success",
      "success",
      "success",
      "success",
    ]);
    expect(getCreatedCells(result).map((cell) => cell.id)).toEqual([
      "journey-output-cell",
    ]);
    expect(evaluateJourneyPrediction("pass", result)).toBe(true);
  });

  it("stops at permission and commit when the witness is missing", () => {
    const result = simulateStateTransition(false);
    const stages = deriveJourneyStages(result);

    expect(stages.map((stage) => stage.status)).toEqual([
      "success",
      "success",
      "error",
      "success",
      "error",
    ]);
    expect(stages[2].protocolDetail).toContain("no matching witness");
    expect(getCreatedCells(result)).toEqual([]);
    expect(evaluateJourneyPrediction("fix", result)).toBe(true);
  });
});
