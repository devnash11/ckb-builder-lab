import { estimateOccupiedCapacity } from "./capacity";
import {
  cloneLedger,
  createCellFromOutput,
  defaultIdFactory,
  type IdFactory,
} from "./cells";
import type {
  Cell,
  DraftCellOutput,
  DraftTransaction,
  LedgerState,
  SimulationMode,
  SimulationResult,
  TypeScriptRule,
  ValidationError,
  ValidationSeverity,
  ValidationTraceEvent,
} from "./types";

export type SimulateTransactionInput = {
  mode: SimulationMode;
  ledger: LedgerState;
  transaction: DraftTransaction;
  idFactory?: IdFactory;
};

type TraceWriter = (
  severity: ValidationSeverity,
  title: string,
  detail: string,
) => void;

function sameTypeRule(
  left: TypeScriptRule | null,
  right: TypeScriptRule | null,
): boolean {
  return JSON.stringify(left) === JSON.stringify(right);
}

function isConstrainedType(type: TypeScriptRule | null): type is TypeScriptRule {
  return type !== null && type.kind !== "none";
}

function parseCounterData(data: string): number | null {
  const value = Number(data);
  return Number.isInteger(value) ? value : null;
}

function validateTypeTransition(
  inputCell: Cell,
  output: DraftCellOutput,
): ValidationError | null {
  const type = inputCell.type;

  if (!isConstrainedType(type) || !sameTypeRule(type, output.type)) {
    return null;
  }

  if (type.kind === "immutable-data") {
    if (inputCell.data === output.data) {
      return null;
    }

    return {
      code: "TYPE_RULE_VIOLATION",
      cellId: inputCell.id,
      message:
        "Immutable data type rule requires matching output data to stay unchanged.",
    };
  }

  if (type.kind === "counter") {
    const inputValue = parseCounterData(inputCell.data);
    const outputValue = parseCounterData(output.data);
    const expectedDelta = type.direction === "increment" ? 1 : -1;

    if (
      inputValue !== null &&
      outputValue !== null &&
      outputValue - inputValue === expectedDelta
    ) {
      return null;
    }

    return {
      code: "TYPE_RULE_VIOLATION",
      cellId: inputCell.id,
      message: `Counter type rule requires output data to ${type.direction} by exactly 1.`,
    };
  }

  return null;
}

function validateTypeRules(
  inputCells: Cell[],
  outputs: DraftCellOutput[],
  addTrace: TraceWriter,
): ValidationError[] {
  const errors: ValidationError[] = [];

  for (const inputCell of inputCells) {
    if (!isConstrainedType(inputCell.type)) {
      continue;
    }

    const matchingOutputs = outputs.filter((output) =>
      sameTypeRule(inputCell.type, output.type),
    );

    for (const output of matchingOutputs) {
      const error = validateTypeTransition(inputCell, output);

      if (error) {
        errors.push(error);
        addTrace("error", "Type rule failed", error.message);
      }
    }
  }

  if (errors.length === 0) {
    addTrace(
      "success",
      "Type rules checked",
      "No educational type script constraints were violated.",
    );
  }

  return errors;
}

export function simulateTransaction({
  mode,
  ledger,
  transaction,
  idFactory = defaultIdFactory,
}: SimulateTransactionInput): SimulationResult {
  const before = cloneLedger(ledger);
  const trace: ValidationTraceEvent[] = [];
  const errors: ValidationError[] = [];

  const addTrace: TraceWriter = (severity, title, detail) => {
    trace.push({
      id: `trace-${trace.length + 1}`,
      severity,
      title,
      detail,
    });
  };

  addTrace(
    "info",
    "Simulation started",
    mode === "educational-genesis"
      ? "Educational genesis mode can create beginner Cells without inputs."
      : "Transaction mode consumes live input Cells and creates output Cells.",
  );

  if (transaction.outputs.length === 0) {
    const error: ValidationError = {
      code: "NO_OUTPUTS",
      message: "A transaction must create at least one output Cell.",
    };
    errors.push(error);
    addTrace("error", "No outputs", error.message);
  } else {
    addTrace(
      "success",
      "Outputs found",
      `${transaction.outputs.length} output Cell draft(s) will be checked.`,
    );
  }

  if (mode === "transaction" && transaction.inputs.length === 0) {
    const error: ValidationError = {
      code: "NO_INPUTS",
      message: "Transaction mode requires at least one live input Cell.",
    };
    errors.push(error);
    addTrace("error", "No inputs", error.message);
  }

  const inputCells: Cell[] = [];

  for (const inputId of transaction.inputs) {
    const inputCell = before.cells[inputId];

    if (!inputCell) {
      const error: ValidationError = {
        code: "UNKNOWN_INPUT",
        cellId: inputId,
        message: `Input Cell ${inputId} does not exist in the local ledger.`,
      };
      errors.push(error);
      addTrace("error", "Unknown input", error.message);
      continue;
    }

    if (inputCell.status === "consumed") {
      const error: ValidationError = {
        code: "CONSUMED_INPUT",
        cellId: inputId,
        message: `Input Cell ${inputId} has already been consumed.`,
      };
      errors.push(error);
      addTrace("error", "Consumed input", error.message);
      continue;
    }

    inputCells.push(inputCell);
    addTrace(
      "success",
      "Live input found",
      `Input Cell ${inputId} is live and can be consumed.`,
    );
  }

  for (const [index, output] of transaction.outputs.entries()) {
    if (output.capacity <= 0) {
      const error: ValidationError = {
        code: "INVALID_CAPACITY",
        message: `Output ${index + 1} must have capacity greater than 0.`,
      };
      errors.push(error);
      addTrace("error", "Invalid capacity", error.message);
    }

    if (output.lock === null) {
      const error: ValidationError = {
        code: "MISSING_LOCK",
        message: `Output ${index + 1} needs a lock script to represent ownership.`,
      };
      errors.push(error);
      addTrace("error", "Missing lock", error.message);
    }

    const occupiedCapacity = estimateOccupiedCapacity(output);

    if (output.capacity < occupiedCapacity) {
      const error: ValidationError = {
        code: "INSUFFICIENT_OCCUPIED_CAPACITY",
        message: `Output ${index + 1} needs at least ${occupiedCapacity} CKBytes for its fields and data.`,
      };
      errors.push(error);
      addTrace("error", "Insufficient occupied capacity", error.message);
    } else {
      addTrace(
        "success",
        "Capacity covers storage",
        `Output ${index + 1} has ${output.capacity} CKBytes and needs ${occupiedCapacity} CKBytes.`,
      );
    }
  }

  if (mode === "transaction") {
    const inputCapacity = inputCells.reduce((total, cell) => total + cell.capacity, 0);
    const outputCapacity = transaction.outputs.reduce(
      (total, output) => total + output.capacity,
      0,
    );

    if (outputCapacity > inputCapacity) {
      const error: ValidationError = {
        code: "CAPACITY_NOT_CONSERVED",
        message: `Output capacity ${outputCapacity} CKBytes exceeds input capacity ${inputCapacity} CKBytes.`,
      };
      errors.push(error);
      addTrace("error", "Capacity not conserved", error.message);
    } else if (inputCells.length > 0) {
      addTrace(
        "success",
        "Capacity conserved",
        `Outputs use ${outputCapacity} of ${inputCapacity} available CKBytes.`,
      );
    }

    for (const inputCell of inputCells) {
      const hasWitness = transaction.witnesses.some(
        (witness) => witness.owner === inputCell.lock.owner,
      );

      if (!hasWitness) {
        const error: ValidationError = {
          code: "MISSING_WITNESS",
          cellId: inputCell.id,
          message: `Input Cell ${inputCell.id} is locked by ${inputCell.lock.owner}, but no matching witness was provided.`,
        };
        errors.push(error);
        addTrace("error", "Missing witness", error.message);
      } else {
        addTrace(
          "success",
          "Witness accepted",
          `${inputCell.lock.owner} can unlock input Cell ${inputCell.id}.`,
        );
      }
    }

    errors.push(...validateTypeRules(inputCells, transaction.outputs, addTrace));
  }

  if (errors.length > 0) {
    addTrace(
      "error",
      "Simulation failed",
      "The ledger was not changed because validation did not pass.",
    );

    return {
      ok: false,
      mode,
      transaction,
      before,
      after: null,
      trace,
      errors,
    };
  }

  const after = cloneLedger(before);

  if (mode === "transaction") {
    for (const inputCell of inputCells) {
      after.cells[inputCell.id] = {
        ...after.cells[inputCell.id],
        status: "consumed",
      };
    }
  }

  for (const [index, output] of transaction.outputs.entries()) {
    const outputCell = createCellFromOutput(output, idFactory(index, output));
    after.cells[outputCell.id] = outputCell;
  }

  addTrace(
    "success",
    "Simulation succeeded",
    mode === "educational-genesis"
      ? "The educational genesis action created live Cell output(s)."
      : "Input Cells were consumed and output Cells were created.",
  );

  return {
    ok: true,
    mode,
    transaction,
    before,
    after,
    trace,
    errors,
  };
}
