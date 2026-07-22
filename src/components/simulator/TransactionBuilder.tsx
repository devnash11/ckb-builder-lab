import { FilePlus2, ShieldCheck } from "lucide-react";
import type { DraftCellOutput, OwnerName, SimulationMode } from "../../simulator";
import { estimateOccupiedCapacity } from "../../simulator";
import {
  formatCapacity,
  formatTypeRule,
  ownerOptions,
  type TypeOption,
  typeRuleFromOption,
} from "./format";
import { HelpTip } from "./HelpTip";

type TransactionBuilderProps = {
  mode: SimulationMode;
  outputDraft: DraftCellOutput;
  includeOutput: boolean;
  includeLock: boolean;
  witnessOwners: OwnerName[];
  onModeChange: (mode: SimulationMode) => void;
  onOutputChange: (output: DraftCellOutput) => void;
  onIncludeOutputChange: (includeOutput: boolean) => void;
  onIncludeLockChange: (includeLock: boolean) => void;
  onWitnessToggle: (owner: OwnerName) => void;
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
  onModeChange,
  onOutputChange,
  onIncludeOutputChange,
  onIncludeLockChange,
  onWitnessToggle,
}: TransactionBuilderProps) {
  const occupiedCapacity = estimateOccupiedCapacity(outputDraft);
  const typeOption = selectedTypeOption(outputDraft);

  return (
    <section className="pane builder-pane" aria-labelledby="builder-title">
      <div className="pane-heading">
        <div>
          <p className="eyebrow">Compose</p>
          <h2 id="builder-title">Transaction draft</h2>
        </div>
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

      <div className="mode-note">
        {mode === "transaction"
          ? "Transaction mode consumes selected live Cells and creates output Cells."
          : "Genesis mode is an educational shortcut for creating beginner Cells without inputs."}
      </div>

      <fieldset className="control-group">
        <legend>
          <ShieldCheck size={16} aria-hidden="true" />
          Witnesses
          <HelpTip label="What is a witness?">
            A witness proves that the current owner allows an input Cell to be
            spent. This lab represents that proof with an owner name.
          </HelpTip>
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
          <HelpTip label="What is an output Cell?">
            An output Cell is new state created by the transaction. It becomes live
            after a valid result is applied.
          </HelpTip>
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
            <span className="field-label">
              Capacity
              <HelpTip label="What is capacity?">
                Capacity is CKB value and storage space. A Cell needs enough CKBytes
                to hold its scripts and data.
              </HelpTip>
            </span>
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
            <span className="field-label">
              Owner
              <HelpTip label="What does owner mean?">
                The output lock names who may spend this new Cell in a later
                transaction.
              </HelpTip>
            </span>
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
            <span className="field-label">
              Type Script
              <HelpTip label="What is a type script?">
                A type script checks how Cell data may change, such as keeping data
                fixed or changing a counter by one.
              </HelpTip>
            </span>
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
            <span className="field-label">
              Data
              <HelpTip label="What is Cell data?">
                Data is the application state stored inside the Cell. Its size uses
                part of the Cell's capacity.
              </HelpTip>
            </span>
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
    </section>
  );
}
