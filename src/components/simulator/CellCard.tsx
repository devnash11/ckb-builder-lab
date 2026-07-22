import { LockKeyhole, PackageCheck, PackageX } from "lucide-react";
import type { Cell } from "../../simulator";
import { formatCapacity, formatTypeRule } from "./format";

type CellCardProps = {
  cell: Cell;
  checked?: boolean;
  disabled?: boolean;
  onToggle?: (cellId: string) => void;
};

export function CellCard({ cell, checked = false, disabled, onToggle }: CellCardProps) {
  const isConsumed = cell.status === "consumed";

  return (
    <label
      className={`cell-row ${checked ? "is-selected" : ""} ${
        isConsumed ? "is-consumed" : ""
      }`}
    >
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled || isConsumed}
        onChange={() => onToggle?.(cell.id)}
        aria-label={`Select ${cell.id}`}
      />
      <span className="cell-row-icon" aria-hidden="true">
        {isConsumed ? <PackageX size={18} /> : <PackageCheck size={18} />}
      </span>
      <span className="cell-row-main">
        <span className="cell-row-title">{cell.id}</span>
        <span className="cell-row-data">{cell.data || "0x"}</span>
      </span>
      <span className="cell-row-meta">
        <span>{formatCapacity(cell.capacity)}</span>
        <span>
          <LockKeyhole size={14} aria-hidden="true" />
          {cell.lock.owner}
        </span>
        <span>{formatTypeRule(cell.type)}</span>
      </span>
      <span className={`status-pill ${isConsumed ? "danger" : "success"}`}>
        {cell.status}
      </span>
    </label>
  );
}
