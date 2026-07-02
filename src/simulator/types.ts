export type CellStatus = "live" | "consumed";

export type OwnerName = "Alice" | "Bob" | "Carol" | string;

export type LockScript = {
  kind: "owner-lock";
  owner: OwnerName;
};

export type TypeScriptRule =
  | { kind: "none" }
  | { kind: "immutable-data" }
  | { kind: "counter"; direction: "increment" | "decrement" };

export type Cell = {
  id: string;
  capacity: number;
  lock: LockScript;
  type: TypeScriptRule | null;
  data: string;
  status: CellStatus;
};

export type DraftCellOutput = {
  capacity: number;
  lock: LockScript | null;
  type: TypeScriptRule | null;
  data: string;
};

export type Witness = {
  owner: OwnerName;
};

export type DraftTransaction = {
  inputs: string[];
  outputs: DraftCellOutput[];
  witnesses: Witness[];
};

export type LedgerState = {
  cells: Record<string, Cell>;
};

export type ValidationSeverity = "info" | "success" | "warning" | "error";

export type ValidationTraceEvent = {
  id: string;
  severity: ValidationSeverity;
  title: string;
  detail: string;
};

export type ValidationError = {
  code:
    | "NO_INPUTS"
    | "NO_OUTPUTS"
    | "UNKNOWN_INPUT"
    | "CONSUMED_INPUT"
    | "INVALID_CAPACITY"
    | "MISSING_LOCK"
    | "INSUFFICIENT_OCCUPIED_CAPACITY"
    | "CAPACITY_NOT_CONSERVED"
    | "MISSING_WITNESS"
    | "TYPE_RULE_VIOLATION";
  message: string;
  cellId?: string;
};

export type SimulationMode = "educational-genesis" | "transaction";

export type SimulationResult = {
  ok: boolean;
  mode: SimulationMode;
  transaction: DraftTransaction;
  before: LedgerState;
  after: LedgerState | null;
  trace: ValidationTraceEvent[];
  errors: ValidationError[];
};

