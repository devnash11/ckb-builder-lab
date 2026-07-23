import type {
  Cell,
  SimulationResult,
  ValidationError,
} from "../../simulator";

export type JourneyLanguage = "plain" | "protocol";
export type JourneyPrediction = "pass" | "fix";
export type JourneyStageStatus = "pending" | "success" | "error";
export type JourneyStageId =
  | "structure"
  | "capacity"
  | "lock"
  | "type"
  | "commit";

export type JourneyStage = {
  id: JourneyStageId;
  status: JourneyStageStatus;
  plainTitle: string;
  protocolTitle: string;
  plainDetail: string;
  protocolDetail: string;
};

type StageDefinition = Omit<JourneyStage, "status" | "plainDetail" | "protocolDetail"> & {
  errorCodes: ValidationError["code"][];
  plainSuccess: string;
  plainFailure: string;
  protocolSuccess: string;
};

const stageDefinitions: StageDefinition[] = [
  {
    id: "structure",
    plainTitle: "Needed pieces",
    protocolTitle: "Structure",
    errorCodes: [
      "NO_INPUTS",
      "NO_OUTPUTS",
      "UNKNOWN_INPUT",
      "CONSUMED_INPUT",
      "INVALID_CAPACITY",
    ],
    plainSuccess: "The simulator found the Cells needed to describe this change.",
    plainFailure: "The transaction is missing a usable input or output Cell.",
    protocolSuccess: "Input and output structure checks passed.",
  },
  {
    id: "capacity",
    plainTitle: "Value and space",
    protocolTitle: "Capacity",
    errorCodes: ["INSUFFICIENT_OCCUPIED_CAPACITY", "CAPACITY_NOT_CONSERVED"],
    plainSuccess: "The outputs fit in their CKBytes and do not create extra capacity.",
    plainFailure: "The output needs more storage space or more capacity than the inputs provide.",
    protocolSuccess: "Occupied capacity and conservation checks passed.",
  },
  {
    id: "lock",
    plainTitle: "Permission",
    protocolTitle: "Lock + witness",
    errorCodes: ["MISSING_LOCK", "MISSING_WITNESS"],
    plainSuccess: "Every new Cell has an owner and every input owner gave permission.",
    plainFailure: "An ownership lock or the matching permission is missing.",
    protocolSuccess: "Output lock and input witness checks passed.",
  },
  {
    id: "type",
    plainTitle: "Change rule",
    protocolTitle: "Type script",
    errorCodes: ["TYPE_RULE_VIOLATION"],
    plainSuccess: "The data change follows the Cell's rule.",
    plainFailure: "The input and output data do not follow the selected change rule.",
    protocolSuccess: "Educational type script checks passed.",
  },
  {
    id: "commit",
    plainTitle: "Replace state",
    protocolTitle: "Atomic commit",
    errorCodes: [],
    plainSuccess: "The old input can be consumed and the new output can become live.",
    plainFailure: "Nothing changes because every rule must pass together.",
    protocolSuccess: "The simulator produced a valid next ledger state.",
  },
];

export function deriveJourneyStages(
  result: SimulationResult | null,
): JourneyStage[] {
  return stageDefinitions.map((definition) => {
    if (!result) {
      return {
        id: definition.id,
        status: "pending",
        plainTitle: definition.plainTitle,
        protocolTitle: definition.protocolTitle,
        plainDetail: "Run the simulation to check this step.",
        protocolDetail: "Awaiting simulation.",
      };
    }

    if (definition.id === "commit") {
      return {
        id: definition.id,
        status: result.ok ? "success" : "error",
        plainTitle: definition.plainTitle,
        protocolTitle: definition.protocolTitle,
        plainDetail: result.ok ? definition.plainSuccess : definition.plainFailure,
        protocolDetail: result.ok
          ? definition.protocolSuccess
          : "The ledger remains unchanged because validation returned errors.",
      };
    }

    const matchingError = result.errors.find((error) =>
      definition.errorCodes.includes(error.code),
    );

    return {
      id: definition.id,
      status: matchingError ? "error" : "success",
      plainTitle: definition.plainTitle,
      protocolTitle: definition.protocolTitle,
      plainDetail: matchingError ? definition.plainFailure : definition.plainSuccess,
      protocolDetail: matchingError?.message ?? definition.protocolSuccess,
    };
  });
}

export function getCreatedCells(result: SimulationResult | null): Cell[] {
  if (!result?.after) {
    return [];
  }

  return Object.values(result.after.cells).filter(
    (cell) => !result.before.cells[cell.id] && cell.status === "live",
  );
}

export function evaluateJourneyPrediction(
  prediction: JourneyPrediction | null,
  result: SimulationResult | null,
): boolean | null {
  if (!prediction || !result) {
    return null;
  }

  return prediction === (result.ok ? "pass" : "fix");
}
