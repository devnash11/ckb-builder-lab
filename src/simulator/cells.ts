import type { Cell, DraftCellOutput, LedgerState, TypeScriptRule } from "./types";

export type IdFactory = (index: number, output: DraftCellOutput) => string;

let nextCellId = 1;

export const defaultIdFactory: IdFactory = () => {
  const id = `cell-${nextCellId}`;
  nextCellId += 1;
  return id;
};

function cloneTypeRule(type: TypeScriptRule | null): TypeScriptRule | null {
  return type === null ? null : { ...type };
}

export function cloneCell(cell: Cell): Cell {
  return {
    ...cell,
    lock: { ...cell.lock },
    type: cloneTypeRule(cell.type),
  };
}

export function cloneLedger(ledger: LedgerState): LedgerState {
  return {
    cells: Object.fromEntries(
      Object.entries(ledger.cells).map(([id, cell]) => [id, cloneCell(cell)]),
    ),
  };
}

export function createCellFromOutput(output: DraftCellOutput, id: string): Cell {
  if (output.lock === null) {
    throw new Error("Cannot create a Cell from an output without a lock script.");
  }

  return {
    id,
    capacity: output.capacity,
    lock: { ...output.lock },
    type: cloneTypeRule(output.type),
    data: output.data,
    status: "live",
  };
}

export function getLiveCells(ledger: LedgerState): Cell[] {
  return Object.values(ledger.cells).filter((cell) => cell.status === "live");
}

export function getConsumedCells(ledger: LedgerState): Cell[] {
  return Object.values(ledger.cells).filter(
    (cell) => cell.status === "consumed",
  );
}
