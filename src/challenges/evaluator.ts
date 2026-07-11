import type {
  ChallengeEvaluation,
  ChallengeEvaluationInput,
  ChallengeMessage,
} from "./types";
import type { Cell, LedgerState, SimulationResult } from "../simulator/types";

function getCreatedCells(result: SimulationResult): Cell[] {
  if (!result.after) {
    return [];
  }

  return Object.values(result.after.cells).filter(
    (cell) => !result.before.cells[cell.id] && cell.status === "live",
  );
}

function getInputCells(ledger: LedgerState, inputIds: string[]): Cell[] {
  return inputIds.flatMap((id) => {
    const cell = ledger.cells[id];
    return cell ? [cell] : [];
  });
}

function buildEvaluation(
  criteria: Record<string, boolean>,
  successMessage: string,
  failureMessage: string,
): ChallengeEvaluation {
  const completedCriteria = Object.entries(criteria)
    .filter(([, completed]) => completed)
    .map(([id]) => id);
  const failedCriteria = Object.entries(criteria)
    .filter(([, completed]) => !completed)
    .map(([id]) => id);
  const passed = failedCriteria.length === 0;
  const messages: ChallengeMessage[] = [
    {
      severity: passed ? "success" : "error",
      text: passed ? successMessage : failureMessage,
    },
  ];

  return {
    passed,
    messages,
    completedCriteria,
    failedCriteria,
  };
}

export function evaluateChallenge({
  challenge,
  ledger,
  draftTransaction,
  simulationResult,
}: ChallengeEvaluationInput): ChallengeEvaluation {
  const createdCells = getCreatedCells(simulationResult);

  if (challenge.id === "create-first-cell") {
    return buildEvaluation(
      {
        "simulation-succeeds": simulationResult.ok && createdCells.length > 0,
        "positive-capacity": createdCells.some((cell) => cell.capacity > 0),
        "lock-exists": createdCells.some((cell) => cell.lock.kind === "owner-lock"),
      },
      "A live Cell was created with capacity, ownership, and data.",
      "Create a valid output Cell with positive capacity and a lock owner.",
    );
  }

  if (challenge.id === "execute-state-transition") {
    const consumedInput = simulationResult.after
      ? draftTransaction.inputs.some(
          (id) => simulationResult.after?.cells[id]?.status === "consumed",
        )
      : false;

    return buildEvaluation(
      {
        "simulation-succeeds": simulationResult.ok,
        "input-consumed": consumedInput,
        "output-created": createdCells.length > 0,
      },
      "The original Cell was consumed and a new live Cell replaced it.",
      "Select a live input Cell, provide the owner witness, and create an output Cell.",
    );
  }

  if (challenge.id === "transfer-ownership") {
    const inputCells = getInputCells(ledger, draftTransaction.inputs);
    const inputOwner = inputCells[0]?.lock.owner;
    const outputOwner = createdCells[0]?.lock.owner;

    return buildEvaluation(
      {
        "simulation-succeeds": simulationResult.ok,
        "owner-changed": inputOwner === "Alice" && outputOwner === "Bob",
      },
      "Ownership changed from Alice to Bob through the output lock script.",
      "The transaction must unlock Alice's input Cell and create a Bob-owned output Cell.",
    );
  }

  return {
    passed: false,
    messages: [
      {
        severity: "error",
        text: `No evaluator is implemented for challenge ${challenge.id}.`,
      },
    ],
    completedCriteria: [],
    failedCriteria: challenge.successCriteria.map((criterion) => criterion.id),
  };
}
