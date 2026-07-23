"use client";

import {
  ArrowRight,
  Boxes,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  CircleDashed,
  Database,
  FileCode2,
  LockKeyhole,
  Pause,
  Play,
  RotateCcw,
  Scale,
  ShieldCheck,
  Wrench,
  XCircle,
} from "lucide-react";
import { useEffect, useState } from "react";
import type {
  Cell,
  DraftCellOutput,
  SimulationMode,
  SimulationResult,
} from "../../simulator";
import { estimateOccupiedCapacity } from "../../simulator";
import { formatCapacity, formatTypeRule } from "./format";
import {
  deriveJourneyStages,
  evaluateJourneyPrediction,
  getCreatedCells,
  type JourneyLanguage,
  type JourneyPrediction,
  type JourneyStage,
  type JourneyStageId,
  type JourneyStageStatus,
} from "./journey";

type JourneyCellState = "live" | "draft" | "consumed" | "blocked" | "empty";
type FocusedCell = "input" | "output";

type CellJourneyProps = {
  mode: SimulationMode;
  selectedInputs: Cell[];
  outputDrafts: DraftCellOutput[];
  result: SimulationResult | null;
  prediction: JourneyPrediction | null;
  onPredictionChange: (prediction: JourneyPrediction) => void;
  onFixStage: (stageId: JourneyStageId) => void;
};

function StageStatusIcon({ status }: { status: JourneyStageStatus }) {
  if (status === "success") {
    return <CheckCircle2 size={17} aria-hidden="true" />;
  }

  if (status === "error") {
    return <XCircle size={17} aria-hidden="true" />;
  }

  return <CircleDashed size={17} aria-hidden="true" />;
}

function JourneyCellNode({
  cell,
  label,
  state,
  active,
  onClick,
}: {
  cell: Cell | DraftCellOutput | null;
  label: string;
  state: JourneyCellState;
  active: boolean;
  onClick: () => void;
}) {
  const occupied = cell ? estimateOccupiedCapacity(cell) : 0;
  const capacity = cell?.capacity ?? 0;
  const fill = capacity > 0 ? Math.min((occupied / capacity) * 100, 100) : 0;

  return (
    <button
      type="button"
      className={`journey-cell-node ${state} ${active ? "is-active" : ""}`}
      onClick={onClick}
      disabled={!cell}
    >
      <span className="journey-cell-topline">
        <Boxes size={15} aria-hidden="true" />
        <strong>{label}</strong>
        <small>{state}</small>
      </span>
      {cell ? (
        <>
          <span className="journey-cell-capacity">
            <span>
              <i style={{ width: `${fill}%` }} />
            </span>
            <small>{formatCapacity(capacity)}</small>
          </span>
          <span className="journey-cell-owner">
            <LockKeyhole size={12} aria-hidden="true" />
            {cell.lock?.owner ?? "No lock"}
          </span>
          <code>{cell.data || "0x"}</code>
        </>
      ) : (
        <span className="journey-cell-empty">No Cell on this side</span>
      )}
    </button>
  );
}

function AnatomyPanel({
  cell,
  side,
  language,
}: {
  cell: Cell | DraftCellOutput | null;
  side: FocusedCell;
  language: JourneyLanguage;
}) {
  const occupied = cell ? estimateOccupiedCapacity(cell) : 0;
  const fieldNames =
    language === "plain"
      ? {
          capacity: "Value + space",
          lock: "Who controls it",
          type: "Change rule",
          data: "Stored state",
        }
      : {
          capacity: "Capacity",
          lock: "Lock script",
          type: "Type script",
          data: "Data",
        };

  return (
    <details className="journey-anatomy">
      <summary>
        <span>Cell details</span>
        <small>{side}</small>
      </summary>
      {cell ? (
        <div className="anatomy-grid">
          <div className="anatomy-field capacity">
            <Scale size={15} aria-hidden="true" />
            <span>
              <small>{fieldNames.capacity}</small>
              <strong>{formatCapacity(cell.capacity)}</strong>
              <em>{occupied} occupied</em>
            </span>
          </div>
          <div className="anatomy-field">
            <LockKeyhole size={15} aria-hidden="true" />
            <span>
              <small>{fieldNames.lock}</small>
              <strong>{cell.lock?.owner ?? "Missing"}</strong>
            </span>
          </div>
          <div className="anatomy-field">
            <ShieldCheck size={15} aria-hidden="true" />
            <span>
              <small>{fieldNames.type}</small>
              <strong>{formatTypeRule(cell.type)}</strong>
            </span>
          </div>
          <div className="anatomy-field">
            <FileCode2 size={15} aria-hidden="true" />
            <span>
              <small>{fieldNames.data}</small>
              <strong className="anatomy-data">{cell.data || "0x"}</strong>
            </span>
          </div>
        </div>
      ) : (
        <p className="journey-cell-empty">Select a side that contains a Cell.</p>
      )}
    </details>
  );
}

export function CellJourney({
  mode,
  selectedInputs,
  outputDrafts,
  result,
  prediction,
  onPredictionChange,
  onFixStage,
}: CellJourneyProps) {
  const stages = deriveJourneyStages(result);
  const finalStageIndex = stages.length - 1;
  const [language, setLanguage] = useState<JourneyLanguage>("plain");
  const [activeStageIndex, setActiveStageIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [focusedCell, setFocusedCell] = useState<FocusedCell>(
    selectedInputs.length > 0 ? "input" : "output",
  );
  const activeStage = stages[activeStageIndex];
  const predictionCorrect = evaluateJourneyPrediction(prediction, result);
  const createdCells = getCreatedCells(result);
  const commitRevealed = activeStageIndex === finalStageIndex;
  const validCommit = Boolean(commitRevealed && result?.ok);
  const inputCell = selectedInputs[0] ?? null;
  const outputCell =
    validCommit && createdCells.length > 0
      ? createdCells[0]
      : outputDrafts[0] ?? null;
  const inputState: JourneyCellState =
    !inputCell
      ? "empty"
      : validCommit && mode === "transaction"
        ? "consumed"
        : "live";
  const outputState: JourneyCellState = result
    ? commitRevealed
      ? result.ok
        ? "live"
        : "blocked"
      : "draft"
    : "draft";

  useEffect(() => {
    if (!result) {
      setActiveStageIndex(0);
      setPlaying(false);
      setFocusedCell(selectedInputs.length > 0 ? "input" : "output");
      return;
    }

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    setFocusedCell(selectedInputs.length > 0 ? "input" : "output");
    setActiveStageIndex(reducedMotion ? finalStageIndex : 0);
    setPlaying(!reducedMotion);
  }, [finalStageIndex, result, selectedInputs.length]);

  useEffect(() => {
    if (!playing) {
      return;
    }

    if (activeStageIndex >= finalStageIndex) {
      setPlaying(false);
      return;
    }

    const timer = window.setTimeout(
      () => setActiveStageIndex((current) => current + 1),
      720,
    );
    return () => window.clearTimeout(timer);
  }, [activeStageIndex, finalStageIndex, playing]);

  function selectStage(index: number) {
    setPlaying(false);
    setActiveStageIndex(index);
  }

  function stageTitle(stage: JourneyStage) {
    return language === "plain" ? stage.plainTitle : stage.protocolTitle;
  }

  function stageDetail(stage: JourneyStage) {
    if (
      stage.id === "commit" &&
      mode === "educational-genesis" &&
      result?.ok
    ) {
      return language === "plain"
        ? "The new output can now become the first live Cell."
        : "The educational genesis action produced a live output without inputs.";
    }

    return language === "plain" ? stage.plainDetail : stage.protocolDetail;
  }

  const visibleStageStatus = (index: number): JourneyStageStatus =>
    result && index <= activeStageIndex ? stages[index].status : "pending";

  return (
    <section className="journey-section" aria-labelledby="journey-title">
      <div className="journey-heading">
        <h3 id="journey-title">Cell Journey</h3>
        <div className="journey-language" aria-label="Explanation language">
          <button
            type="button"
            className={language === "plain" ? "is-active" : ""}
            onClick={() => setLanguage("plain")}
          >
            Plain
          </button>
          <button
            type="button"
            className={language === "protocol" ? "is-active" : ""}
            onClick={() => setLanguage("protocol")}
          >
            Protocol
          </button>
        </div>
      </div>

      <div className={`journey-prediction ${result ? "has-result" : ""}`}>
        {result ? (
          <>
            <span className={predictionCorrect === false ? "missed" : "correct"}>
              {predictionCorrect === false ? <XCircle size={15} /> : <Check size={15} />}
            </span>
            <p>
              <strong>
                {prediction
                  ? predictionCorrect
                    ? "Your prediction matched"
                    : "A useful surprise"
                  : "Result revealed"}
              </strong>
              <small>
                {prediction
                  ? `You chose ${prediction === "pass" ? "Pass" : "Needs a fix"}; the draft ${result.ok ? "passed" : "needs a fix"}.`
                  : `The draft ${result.ok ? "passed every check" : "stopped at a failed rule"}. Predict before the next run.`}
              </small>
            </p>
          </>
        ) : (
          <>
            <p>
              <strong>Predict before you simulate</strong>
              <small>Will this draft pass all five checkpoints?</small>
            </p>
            <span className="prediction-actions">
              <button
                type="button"
                className={prediction === "pass" ? "is-active" : ""}
                onClick={() => onPredictionChange("pass")}
              >
                Pass
              </button>
              <button
                type="button"
                className={prediction === "fix" ? "is-active" : ""}
                onClick={() => onPredictionChange("fix")}
              >
                Needs a fix
              </button>
            </span>
          </>
        )}
      </div>

      <div className="journey-map" aria-label="Cell state transition map">
        <div className="journey-zone">
          <span>{language === "plain" ? "Current state" : "Live ledger"}</span>
          <JourneyCellNode
            cell={inputCell}
            label={inputCell?.id ?? (mode === "educational-genesis" ? "Genesis" : "No input")}
            state={inputState}
            active={focusedCell === "input"}
            onClick={() => setFocusedCell("input")}
          />
        </div>

        <ArrowRight className="journey-arrow" size={19} aria-hidden="true" />

        <div className={`journey-gate ${visibleStageStatus(activeStageIndex)}`}>
          <Database size={17} aria-hidden="true" />
          <small>{language === "plain" ? "Rules" : "Validation"}</small>
          <strong>{stageTitle(activeStage)}</strong>
          <StageStatusIcon status={visibleStageStatus(activeStageIndex)} />
        </div>

        <ArrowRight className="journey-arrow" size={19} aria-hidden="true" />

        <div className="journey-zone">
          <span>{language === "plain" ? "Next state" : "Result ledger"}</span>
          <JourneyCellNode
            cell={outputCell}
            label={
              validCommit && createdCells[0]
                ? createdCells[0].id
                : outputCell
                  ? "Output draft"
                  : "No output"
            }
            state={outputState}
            active={focusedCell === "output"}
            onClick={() => setFocusedCell("output")}
          />
        </div>
      </div>

      <div className="journey-replay-heading">
        <span>
          <strong>Validation path</strong>
        </span>
        <div className="replay-controls" aria-label="Journey replay controls">
          <button
            type="button"
            disabled={!result}
            onClick={() => selectStage(0)}
            aria-label="Restart validation replay"
            title="Restart replay"
          >
            <RotateCcw size={14} aria-hidden="true" />
          </button>
          <button
            type="button"
            disabled={!result || activeStageIndex === 0}
            onClick={() => selectStage(activeStageIndex - 1)}
            aria-label="Previous validation checkpoint"
          >
            <ChevronLeft size={15} aria-hidden="true" />
          </button>
          <button
            type="button"
            disabled={!result}
            onClick={() => {
              if (activeStageIndex === finalStageIndex) {
                setActiveStageIndex(0);
              }
              setPlaying((current) => !current);
            }}
            aria-label={playing ? "Pause validation replay" : "Play validation replay"}
          >
            {playing ? <Pause size={14} /> : <Play size={14} fill="currentColor" />}
          </button>
          <button
            type="button"
            disabled={!result || activeStageIndex === finalStageIndex}
            onClick={() => selectStage(activeStageIndex + 1)}
            aria-label="Next validation checkpoint"
          >
            <ChevronRight size={15} aria-hidden="true" />
          </button>
        </div>
      </div>

      <ol className="journey-checkpoints">
        {stages.map((stage, index) => {
          const status = visibleStageStatus(index);
          return (
            <li key={stage.id}>
              <button
                type="button"
                className={`${status} ${index === activeStageIndex ? "is-active" : ""}`}
                onClick={() => selectStage(index)}
                disabled={!result}
                aria-current={index === activeStageIndex ? "step" : undefined}
              >
                <span>{index + 1}</span>
                <small>{stageTitle(stage)}</small>
              </button>
            </li>
          );
        })}
      </ol>

      <div className={`journey-stage-detail ${visibleStageStatus(activeStageIndex)}`}>
        <span>
          <StageStatusIcon status={visibleStageStatus(activeStageIndex)} />
        </span>
        <p>
          <strong>{stageTitle(activeStage)}</strong>
          <small>{stageDetail(activeStage)}</small>
        </p>
        {result && activeStage.status === "error" && activeStage.id !== "commit" && (
          <button type="button" onClick={() => onFixStage(activeStage.id)}>
            <Wrench size={14} aria-hidden="true" />
            Fix
          </button>
        )}
      </div>

      <AnatomyPanel
        cell={focusedCell === "input" ? inputCell : outputCell}
        side={focusedCell}
        language={language}
      />
    </section>
  );
}
