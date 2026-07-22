import type { Cell } from "../../simulator";
import { CellCard } from "./CellCard";

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
          <p className="eyebrow">Ledger</p>
          <h2 id="ledger-title">Cells</h2>
        </div>
        <div className="metric-pair" aria-label="Cell status counts">
          <span>{liveCount} live</span>
          <span>{consumedCount} consumed</span>
        </div>
      </div>

      <div className="cell-list">
        {cells.map((cell) => (
          <CellCard
            key={cell.id}
            cell={cell}
            checked={selectedInputIds.includes(cell.id)}
            disabled={!transactionMode}
            onToggle={onToggleInput}
          />
        ))}
      </div>
    </section>
  );
}
