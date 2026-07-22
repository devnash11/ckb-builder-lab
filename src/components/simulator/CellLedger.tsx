import { Boxes } from "lucide-react";
import type { Cell } from "../../simulator";
import { CellCard } from "./CellCard";
import { HelpTip } from "./HelpTip";

type CellLedgerProps = {
  cells: Cell[];
  selectedInputIds: string[];
  transactionMode: boolean;
  onToggleInput: (cellId: string) => void;
};

export function CellLedger({
  cells,
  selectedInputIds,
  transactionMode,
  onToggleInput,
}: CellLedgerProps) {
  const liveCount = cells.filter((cell) => cell.status === "live").length;
  const consumedCount = cells.length - liveCount;

  return (
    <section className="pane ledger-pane" aria-labelledby="ledger-title">
      <div className="pane-heading">
        <div>
          <p className="eyebrow">Current state</p>
          <div className="heading-with-help">
            <h2 id="ledger-title">Cell ledger</h2>
            <HelpTip label="What is a Cell?">
              A Cell is a piece of CKB state. It holds capacity, an ownership lock,
              optional rules, and data.
            </HelpTip>
          </div>
        </div>
        <div className="metric-pair" aria-label="Cell status counts">
          <span>{liveCount} live</span>
          <span>{consumedCount} consumed</span>
        </div>
      </div>

      <div className="cell-list">
        {cells.length === 0 ? (
          <div className="ledger-empty">
            <Boxes size={20} aria-hidden="true" />
            <span>
              <strong>No Cells yet</strong>
              <small>Simulate a genesis output to create the first live Cell.</small>
            </span>
          </div>
        ) : (
          cells.map((cell) => (
            <CellCard
              key={cell.id}
              cell={cell}
              checked={selectedInputIds.includes(cell.id)}
              disabled={!transactionMode}
              onToggle={onToggleInput}
            />
          ))
        )}
      </div>
    </section>
  );
}
