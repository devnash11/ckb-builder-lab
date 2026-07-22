import {
  Eraser,
  FilePlus2,
  Play,
  RotateCcw,
  Save,
  ShieldCheck,
} from "lucide-react";
import type { DraftCellOutput, OwnerName, SimulationMode } from "../../simulator";
import { estimateOccupiedCapacity } from "../../simulator";
import {
  formatCapacity,
  formatTypeRule,
  ownerOptions,
  type TypeOption,
  typeRuleFromOption,
} from "./format";

type TransactionBuilderProps = {
  mode: SimulationMode;
  outputDraft: DraftCellOutput;
  includeOutput: boolean;
  includeLock: boolean;
  witnessOwners: OwnerName[];
  canApply: boolean;
  applied: boolean;
  onModeChange: (mode: SimulationMode) => void;
  onOutputChange: (output: DraftCellOutput) => void;
  onIncludeOutputChange: (includeOutput: boolean) => void;
  onIncludeLockChange: (includeLock: boolean) => void;
  onWitnessToggle: (owner: OwnerName) => void;
  onSimulate: () => void;
  onApply: () => void;
  onReset: () => void;
  onClearDraft: () => void;
};

function selectedTypeOption(outputDraft: DraftCellOutput): TypeOption {
  if (outputDraft.type === null || outputDraft.type.kind === "none") {
    return "none";
  }

  if (outputDraft.type.kind === "immutable-data") {
    return "immutable-data";
  }

  return outputDraft.type.direction === "increment"
    ? "counter-increment"
    : "counter-decrement";
}

export function TransactionBuilder({
  mode,
  outputDraft,
  includeOutput,
  includeLock,
  witnessOwners,
  canApply,
  applied,
  onModeChange,
  onOutputChange,
  onIncludeOutputChange,
  onIncludeLockChange,
  onWitnessToggle,
  onSimulate,
  onApply,
  onReset,
  onClearDraft,
}: TransactionBuilderProps) {
  const occupiedCapacity = estimateOccupiedCapacity(outputDraft);
  const typeOption = selectedTypeOption(outputDraft);

  return (
    <section className="pane builder-pane" aria-labelledby="builder-title">
      <div className="pane-heading">
        <div>
          <p className="eyebrow">Transaction Builder</p>
          <h2 id="builder-title">Draft</h2>
        </div>
        <button className="icon-button" type="button" onClick={onReset}>
          <RotateCcw size={17} aria-hidden="true" />
          Reset
        </button>
      </div>

      <div className="segmented-control" aria-label="Simulation mode">
        <button
          type="button"
          className={mode === "transaction" ? "is-active" : ""}
          onClick={() => onModeChange("transaction")}
        >
          Transaction
        </button>
        <button
          type="button"
          className={mode === "educational-genesis" ? "is-active" : ""}
          onClick={() => onModeChange("educational-genesis")}
        >
          Genesis
        </button>
      </div>

      <div className="callout">
        {mode === "transaction"
          ? "Transaction mode consumes selected live Cells and creates output Cells."
          : "Genesis mode is an educational shortcut for creating beginner Cells without inputs."}
      </div>

      <fieldset className="control-group">
        <legend>
          <ShieldCheck size={16} aria-hidden="true" />
          Witnesses
        </legend>
        <div className="checkbox-grid">
          {ownerOptions.map((owner) => (
            <label key={owner} className="check-control">
              <input
                type="checkbox"
                checked={witnessOwners.includes(owner)}
                disabled={mode === "educational-genesis"}
                onChange={() => onWitnessToggle(owner)}
              />
              {owner}
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset className="control-group">
        <legend>
          <FilePlus2 size={16} aria-hidden="true" />
          Output Cell
        </legend>
        <label className="check-control output-toggle">
          <input
            type="checkbox"
            checked={includeOutput}
            onChange={(event) => onIncludeOutputChange(event.target.checked)}
          />
          Include output Cell
        </label>

        <div className="editor-grid" aria-disabled={!includeOutput}>
          <label>
            <span>Capacity</span>
            <input
              type="number"
              min={0}
              value={outputDraft.capacity}
              disabled={!includeOutput}
              onChange={(event) =>
                onOutputChange({
                  ...outputDraft,
                  capacity: Number(event.target.value),
                })
              }
            />
          </label>

          <label>
            <span>Owner</span>
            <select
              value={outputDraft.lock?.owner ?? "no-lock"}
              disabled={!includeOutput || !includeLock}
              onChange={(event) =>
                onOutputChange({
                  ...outputDraft,
                  lock: { kind: "owner-lock", owner: event.target.value },
                })
              }
            >
              <option value="no-lock" disabled>
                No lock selected
              </option>
              {ownerOptions.map((owner) => (
                <option key={owner} value={owner}>
                  {owner}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span>Type Script</span>
            <select
              value={typeOption}
              disabled={!includeOutput}
              onChange={(event) =>
                onOutputChange({
                  ...outputDraft,
                  type: typeRuleFromOption(event.target.value as TypeOption),
                })
              }
            >
              <option value="none">None</option>
              <option value="immutable-data">Immutable data</option>
              <option value="counter-increment">Counter increment</option>
              <option value="counter-decrement">Counter decrement</option>
            </select>
          </label>

          <label className="check-control lock-toggle">
            <input
              type="checkbox"
              checked={includeLock}
              disabled={!includeOutput}
              onChange={(event) => onIncludeLockChange(event.target.checked)}
            />
            Include lock
          </label>

          <label className="data-field">
            <span>Data</span>
            <textarea
              rows={4}
              value={outputDraft.data}
              disabled={!includeOutput}
              onChange={(event) =>
                onOutputChange({ ...outputDraft, data: event.target.value })
              }
            />
          </label>
        </div>

        <div className="capacity-note">
          <span>Estimated occupied capacity</span>
          <strong>{formatCapacity(occupiedCapacity)}</strong>
        </div>
        <div className="type-note">
          Output type rule: {formatTypeRule(outputDraft.type)}
        </div>
        <div className={`type-note ${includeLock ? "lock-present" : "lock-missing"}`}>
          Lock script: {includeLock ? "Included" : "Missing"}
        </div>
      </fieldset>

      <div className="action-row">
        <button className="primary-button" type="button" onClick={onSimulate}>
          <Play size={17} aria-hidden="true" />
          Simulate
        </button>
        <button
          className="icon-button"
          type="button"
          disabled={!canApply || applied}
          onClick={onApply}
        >
          <Save size={17} aria-hidden="true" />
          {applied ? "Applied" : "Apply"}
        </button>
        <button className="icon-button" type="button" onClick={onClearDraft}>
          <Eraser size={17} aria-hidden="true" />
          Clear Draft
        </button>
      </div>
    </section>
  );
}
