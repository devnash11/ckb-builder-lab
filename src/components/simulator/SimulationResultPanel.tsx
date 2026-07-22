import { ArrowRight, CheckCircle2, CircleDashed, XCircle } from "lucide-react";
import type { Cell, DraftCellOutput, SimulationResult } from "../../simulator";
import { describeCell } from "./format";
import { ValidationTrace } from "./ValidationTrace";

type SimulationResultPanelProps = {
  selectedInputs: Cell[];
  outputDrafts: DraftCellOutput[];
  result: SimulationResult | null;
};

function MiniCell({
  detail,
  label,
  muted = false,
}: {
  detail: string;
  label: string;
  muted?: boolean;
}) {
  return (
    <div className={`mini-cell ${muted ? "muted" : ""}`}>
      <strong>{label}</strong>
      <span>{detail}</span>
    </div>
  );
}

export function SimulationResultPanel({
  selectedInputs,
  outputDrafts,
  result,
}: SimulationResultPanelProps) {
  const statusClass = result
    ? result.ok
      ? "success"
      : "danger"
    : "neutral";

  return (
    <section className="pane result-pane" aria-labelledby="result-title">
      <div className="pane-heading">
        <div>
          <p className="eyebrow">Inspect</p>
          <h2 id="result-title">Transaction result</h2>
        </div>
        <span className={`status-pill ${statusClass}`} aria-live="polite">
          {result ? (result.ok ? "valid" : "failed") : "not run"}
        </span>
      </div>

      <div className="flow-strip" aria-label="Transaction flow visualization">
        <div className="flow-column">
          <span>Inputs</span>
          {selectedInputs.length > 0
            ? selectedInputs.map((cell) =>
                <MiniCell
                  key={cell.id}
                  label={cell.id}
                  detail={describeCell(cell)}
                  muted={cell.status === "consumed"}
                />,
              )
            : <MiniCell label="No input" detail="Genesis mode or missing selection" muted />}
        </div>
        <ArrowRight className="flow-arrow" size={22} aria-hidden="true" />
        <div className="flow-column">
          <span>Validation</span>
          <div className={`mini-cell validation-state ${statusClass}`}>
            {result?.ok ? (
              <CheckCircle2 size={18} aria-hidden="true" />
            ) : result ? (
              <XCircle size={18} aria-hidden="true" />
            ) : (
              <CircleDashed size={18} aria-hidden="true" />
            )}
            <strong>{result ? (result.ok ? "Passed" : "Failed") : "Pending"}</strong>
          </div>
        </div>
        <ArrowRight className="flow-arrow" size={22} aria-hidden="true" />
        <div className="flow-column">
          <span>Outputs</span>
          {outputDrafts.length > 0
            ? outputDrafts.map((output, index) =>
                <MiniCell
                  key={`output-${index}`}
                  label={`Output ${index + 1}`}
                  detail={describeCell(output)}
                />,
              )
            : <MiniCell label="No output" detail="Validation will fail without outputs" muted />}
        </div>
      </div>

      {result?.after && (
        <div className="result-summary">
          <div>
            <span>Before</span>
            <strong>{Object.keys(result.before.cells).length} Cells</strong>
          </div>
          <div>
            <span>After</span>
            <strong>{Object.keys(result.after.cells).length} Cells</strong>
          </div>
        </div>
      )}

      <ValidationTrace trace={result?.trace ?? []} />
    </section>
  );
}
