import { describe, expect, it } from "vitest";
import { initialChallenges } from "../content/initial-challenges";
import { simulateTransaction } from "../simulator";
import { evaluateChallenge } from "./evaluator";

function idFactory(index: number) {
  return `created-${index + 1}`;
}

describe("evaluateChallenge", () => {
  it("passes the default create-first-cell challenge setup", () => {
    const challenge = initialChallenges[0];
    const result = simulateTransaction({
      mode: "educational-genesis",
      ledger: challenge.setup.ledger,
      transaction: challenge.setup.draftTransaction,
      idFactory,
    });

    const evaluation = evaluateChallenge({
      challenge,
      ledger: challenge.setup.ledger,
      draftTransaction: challenge.setup.draftTransaction,
      simulationResult: result,
    });

    expect(evaluation.passed).toBe(true);
    expect(evaluation.failedCriteria).toEqual([]);
  });

  it("passes the default execute-state-transition challenge setup", () => {
    const challenge = initialChallenges[1];
    const result = simulateTransaction({
      mode: "transaction",
      ledger: challenge.setup.ledger,
      transaction: challenge.setup.draftTransaction,
      idFactory,
    });

    const evaluation = evaluateChallenge({
      challenge,
      ledger: challenge.setup.ledger,
      draftTransaction: challenge.setup.draftTransaction,
      simulationResult: result,
    });

    expect(evaluation.passed).toBe(true);
    expect(evaluation.completedCriteria).toEqual([
      "simulation-succeeds",
      "input-consumed",
      "output-created",
    ]);
  });

  it("passes the default transfer-ownership challenge setup", () => {
    const challenge = initialChallenges[2];
    const result = simulateTransaction({
      mode: "transaction",
      ledger: challenge.setup.ledger,
      transaction: challenge.setup.draftTransaction,
      idFactory,
    });

    const evaluation = evaluateChallenge({
      challenge,
      ledger: challenge.setup.ledger,
      draftTransaction: challenge.setup.draftTransaction,
      simulationResult: result,
    });

    expect(evaluation.passed).toBe(true);
    expect(evaluation.completedCriteria).toEqual([
      "simulation-succeeds",
      "owner-changed",
    ]);
  });
});
