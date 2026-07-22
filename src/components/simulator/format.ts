import type { Cell, DraftCellOutput, TypeScriptRule } from "../../simulator";

export type TypeOption =
  | "none"
  | "immutable-data"
  | "counter-increment"
  | "counter-decrement";

export const ownerOptions = ["Alice", "Bob", "Carol"] as const;

export function formatCapacity(capacity: number): string {
  return `${capacity} CKBytes`;
}

export function formatTypeRule(type: TypeScriptRule | null): string {
  if (type === null || type.kind === "none") {
    return "None";
  }

  if (type.kind === "immutable-data") {
    return "Immutable data";
  }

  return `Counter ${type.direction}`;
}

export function typeRuleFromOption(option: TypeOption): TypeScriptRule | null {
  if (option === "immutable-data") {
    return { kind: "immutable-data" };
  }

  if (option === "counter-increment") {
    return { kind: "counter", direction: "increment" };
  }

  if (option === "counter-decrement") {
    return { kind: "counter", direction: "decrement" };
  }

  return null;
}

export function optionFromTypeRule(type: TypeScriptRule | null): TypeOption {
  if (type === null || type.kind === "none") {
    return "none";
  }

  if (type.kind === "immutable-data") {
    return "immutable-data";
  }

  return type.direction === "increment"
    ? "counter-increment"
    : "counter-decrement";
}

export function describeCell(cell: Cell | DraftCellOutput): string {
  const lockOwner = cell.lock?.owner ?? "No lock";
  return `${formatCapacity(cell.capacity)} | ${lockOwner} | ${formatTypeRule(cell.type)}`;
}
