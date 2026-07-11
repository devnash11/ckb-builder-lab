import type { Cell, DraftCellOutput, LockScript, TypeScriptRule } from "./types";

export const MIN_BASE_CELL_CAPACITY = 61;
export const TYPE_SCRIPT_CAPACITY = 33;

type CapacityTarget = {
  data: Cell["data"] | DraftCellOutput["data"];
  lock?: LockScript | null;
  type: TypeScriptRule | null;
};

const textEncoder = new TextEncoder();

function hasTypeRule(type: TypeScriptRule | null): boolean {
  return type !== null && type.kind !== "none";
}

export function estimateDataCapacity(data: string): number {
  return textEncoder.encode(data).length;
}

export function estimateOccupiedCapacity(target: CapacityTarget): number {
  const typeCapacity = hasTypeRule(target.type) ? TYPE_SCRIPT_CAPACITY : 0;

  return MIN_BASE_CELL_CAPACITY + estimateDataCapacity(target.data) + typeCapacity;
}
