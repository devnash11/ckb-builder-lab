import type {
  Cell,
  DraftCellOutput,
  SimulationMode,
  SimulationResult,
} from "../../simulator";
import { CellJourney } from "./CellJourney";
import type {
  JourneyPrediction,
  JourneyStageId,
} from "./journey";
import { ValidationTrace } from "./ValidationTrace";

type SimulationResultPanelProps = {
  mode: SimulationMode;
  selectedInputs: Cell[];
  outputDrafts: DraftCellOutput[];
  result: SimulationResult | null;
  prediction: JourneyPrediction | null;
  onPredictionChange: (prediction: JourneyPrediction) => void;
  onFixStage: (stageId: JourneyStageId) => void;
};

export function SimulationResultPanel({
  mode,
  selectedInputs,
  outputDrafts,
  result,
  prediction,
  onPredictionChange,
  onFixStage,
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
          <p className="eyebrow">Result</p>
          <h2 id="result-title">Review</h2>
        </div>
        <span className={`status-pill ${statusClass}`} aria-live="polite">
          {result ? (result.ok ? "valid" : "failed") : "not run"}
        </span>
      </div>

      <CellJourney
        mode={mode}
        selectedInputs={selectedInputs}
        outputDrafts={outputDrafts}
        result={result}
        prediction={prediction}
        onPredictionChange={onPredictionChange}
        onFixStage={onFixStage}
      />

      <details className="secondary-details">
        <summary>
          <span>Validation details</span>
          <small>{result?.trace.length ?? 0}</small>
        </summary>
        <ValidationTrace trace={result?.trace ?? []} />
      </details>
    </section>
  );
}
