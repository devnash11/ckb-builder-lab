"use client";

import {
  BookOpen,
  Boxes,
  CheckCircle2,
  Eraser,
  GraduationCap,
  Info,
  Play,
  RotateCcw,
  Save,
  SlidersHorizontal,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  evaluateChallenge,
  type ChallengeDefinition,
  type ChallengeEvaluation,
} from "../../challenges";
import {
  PROGRESS_STORAGE_KEY,
  parseStoredProgress,
} from "../../challenges/progress";
import { initialChallenges } from "../../content/initial-challenges";
import type {
  DraftCellOutput,
  DraftTransaction,
  LedgerState,
  OwnerName,
  SimulationMode,
  SimulationResult,
} from "../../simulator";
import { simulateTransaction } from "../../simulator";
import { CellLedger } from "./CellLedger";
import { typeRuleFromOption } from "./format";
import { GuidedTour } from "./GuidedTour";
import { LearningRail } from "./LearningRail";
import { SimulationResultPanel } from "./SimulationResultPanel";
import { TransactionBuilder } from "./TransactionBuilder";

type MobileView = "mission" | "cells" | "build" | "result";

type WorkspacePreset = {
  ledger: LedgerState;
  selectedInputIds: string[];
  mode: SimulationMode;
  outputDraft: DraftCellOutput;
  includeOutput: boolean;
  includeLock: boolean;
  witnessOwners: OwnerName[];
};

function createStarterLedger(): LedgerState {
  return {
    cells: {
      "starter-alice-cell": {
        id: "starter-alice-cell",
        capacity: 100,
        lock: { kind: "owner-lock", owner: "Alice" },
        type: null,
        data: "Hello",
        status: "live",
      },
    },
  };
}

function createStarterOutput(): DraftCellOutput {
  return {
    capacity: 100,
    lock: { kind: "owner-lock", owner: "Bob" },
    type: null,
    data: "Hello, CKB",
  };
}

function createSandboxPreset(): WorkspacePreset {
  return {
    ledger: createStarterLedger(),
    selectedInputIds: ["starter-alice-cell"],
    mode: "transaction",
    outputDraft: createStarterOutput(),
    includeOutput: true,
    includeLock: true,
    witnessOwners: ["Alice"],
  };
}

function createChallengePreset(challenge: ChallengeDefinition): WorkspacePreset {
  const setup = structuredClone(challenge.setup);
  const output = setup.draftTransaction.outputs[0] ?? createStarterOutput();

  return {
    ledger: setup.ledger,
    selectedInputIds: setup.draftTransaction.inputs,
    mode:
      setup.draftTransaction.inputs.length === 0
        ? "educational-genesis"
        : "transaction",
    outputDraft: output,
    includeOutput: setup.draftTransaction.outputs.length > 0,
    includeLock: output.lock !== null,
    witnessOwners: [
      ...new Set(setup.draftTransaction.witnesses.map((witness) => witness.owner)),
    ],
  };
}

const defaultChallenge = initialChallenges[0];

export function SimulatorWorkspace() {
  const nextCellNumber = useRef(1);
  const initialPreset = useRef(createChallengePreset(defaultChallenge));
  const [ledger, setLedger] = useState<LedgerState>(initialPreset.current.ledger);
  const [selectedInputIds, setSelectedInputIds] = useState<string[]>(
    initialPreset.current.selectedInputIds,
  );
  const [mode, setMode] = useState<SimulationMode>(initialPreset.current.mode);
  const [outputDraft, setOutputDraft] = useState<DraftCellOutput>(
    initialPreset.current.outputDraft,
  );
  const [includeOutput, setIncludeOutput] = useState(
    initialPreset.current.includeOutput,
  );
  const [includeLock, setIncludeLock] = useState(initialPreset.current.includeLock);
  const [witnessOwners, setWitnessOwners] = useState<OwnerName[]>(
    initialPreset.current.witnessOwners,
  );
  const [lastResult, setLastResult] = useState<SimulationResult | null>(null);
  const [resultApplied, setResultApplied] = useState(false);
  const [activeChallengeId, setActiveChallengeId] = useState<string | null>(
    defaultChallenge.id,
  );
  const [completedChallengeIds, setCompletedChallengeIds] = useState<string[]>([]);
  const [challengeEvaluation, setChallengeEvaluation] =
    useState<ChallengeEvaluation | null>(null);
  const [revealedHintCount, setRevealedHintCount] = useState(0);
  const [mobileView, setMobileView] = useState<MobileView>("mission");
  const [progressLoaded, setProgressLoaded] = useState(false);
  const [tourRestartToken, setTourRestartToken] = useState(0);

  const cells = useMemo(
    () => Object.values(ledger.cells).sort((left, right) => left.id.localeCompare(right.id)),
    [ledger],
  );
  const activeChallenge =
    initialChallenges.find((challenge) => challenge.id === activeChallengeId) ?? null;
  const selectedInputCells = selectedInputIds.flatMap((cellId) => {
    const cell = ledger.cells[cellId];
    return cell ? [cell] : [];
  });
  const outputDrafts = includeOutput ? [outputDraft] : [];

  useEffect(() => {
    const challengeIds = initialChallenges.map((challenge) => challenge.id);
    const storedProgress = parseStoredProgress(
      window.localStorage.getItem(PROGRESS_STORAGE_KEY),
      challengeIds,
      defaultChallenge.id,
    );

    setCompletedChallengeIds(storedProgress.completedChallengeIds);
    activateChallenge(storedProgress.activeChallengeId);
    setProgressLoaded(true);
  }, []);

  useEffect(() => {
    if (!progressLoaded || activeChallengeId === null) {
      return;
    }

    window.localStorage.setItem(
      PROGRESS_STORAGE_KEY,
      JSON.stringify({
        completedChallengeIds,
        activeChallengeId,
        lastUpdatedAt: new Date().toISOString(),
      }),
    );
  }, [activeChallengeId, completedChallengeIds, progressLoaded]);

  function clearResult() {
    setLastResult(null);
    setResultApplied(false);
    setChallengeEvaluation(null);
  }

  function loadPreset(preset: WorkspacePreset) {
    nextCellNumber.current = 1;
    setLedger(preset.ledger);
    setSelectedInputIds(preset.selectedInputIds);
    setMode(preset.mode);
    setOutputDraft(preset.outputDraft);
    setIncludeOutput(preset.includeOutput);
    setIncludeLock(preset.includeLock);
    setWitnessOwners(preset.witnessOwners);
    clearResult();
  }

  function activateChallenge(challengeId: string) {
    const challenge = initialChallenges.find((item) => item.id === challengeId);

    if (!challenge) {
      return;
    }

    setActiveChallengeId(challenge.id);
    setRevealedHintCount(0);
    loadPreset(createChallengePreset(challenge));
  }

  function openSandbox() {
    setActiveChallengeId(null);
    setRevealedHintCount(0);
    loadPreset(createSandboxPreset());
    setMobileView("build");
  }

  function setModeAndCleanSelection(nextMode: SimulationMode) {
    setMode(nextMode);
    clearResult();

    if (nextMode === "educational-genesis") {
      setSelectedInputIds([]);
    }
  }

  function toggleInput(cellId: string) {
    const cell = ledger.cells[cellId];

    if (!cell || cell.status === "consumed" || mode !== "transaction") {
      return;
    }

    setSelectedInputIds((current) =>
      current.includes(cellId)
        ? current.filter((selectedId) => selectedId !== cellId)
        : [...current, cellId],
    );
    clearResult();
  }

  function updateOutputDraft(nextOutput: DraftCellOutput) {
    setOutputDraft(includeLock ? nextOutput : { ...nextOutput, lock: null });
    clearResult();
  }

  function toggleLock(nextIncludeLock: boolean) {
    setIncludeLock(nextIncludeLock);
    setOutputDraft((current) => ({
      ...current,
      lock: nextIncludeLock
        ? { kind: "owner-lock", owner: current.lock?.owner ?? "Alice" }
        : null,
    }));
    clearResult();
  }

  function toggleWitness(owner: OwnerName) {
    setWitnessOwners((current) =>
      current.includes(owner)
        ? current.filter((currentOwner) => currentOwner !== owner)
        : [...current, owner],
    );
    clearResult();
  }

  function simulate() {
    const draftTransaction: DraftTransaction = {
      inputs: mode === "transaction" ? selectedInputIds : [],
      outputs: outputDrafts,
      witnesses:
        mode === "transaction"
          ? witnessOwners.map((owner) => ({ owner }))
          : [],
    };
    const result = simulateTransaction({
      mode,
      ledger,
      transaction: draftTransaction,
      idFactory: (index) => `ui-cell-${nextCellNumber.current + index}`,
    });

    setLastResult(result);
    setResultApplied(false);
    setMobileView("result");

    if (activeChallenge) {
      const evaluation = evaluateChallenge({
        challenge: activeChallenge,
        ledger,
        draftTransaction,
        simulationResult: result,
      });

      setChallengeEvaluation(evaluation);
      if (evaluation.passed) {
        setCompletedChallengeIds((current) =>
          current.includes(activeChallenge.id)
            ? current
            : [...current, activeChallenge.id],
        );
      }
    }
  }

  function applyResult() {
    if (!lastResult?.ok || !lastResult.after || resultApplied) {
      return;
    }

    setLedger(lastResult.after);
    nextCellNumber.current += outputDrafts.length;
    setSelectedInputIds([]);
    setLastResult((current) => current);
    setResultApplied(true);
    setMobileView("cells");
  }

  function reset() {
    loadPreset(
      activeChallenge
        ? createChallengePreset(activeChallenge)
        : createSandboxPreset(),
    );
  }

  function clearDraft() {
    setOutputDraft({
      capacity: 0,
      lock: includeLock ? { kind: "owner-lock", owner: "Alice" } : null,
      type: typeRuleFromOption("none"),
      data: "",
    });
    setIncludeOutput(false);
    clearResult();
  }

  function setOutputIncluded(nextIncludeOutput: boolean) {
    setIncludeOutput(nextIncludeOutput);
    if (nextIncludeOutput && outputDraft.capacity <= 0) {
      setOutputDraft(createStarterOutput());
      setIncludeLock(true);
    }
    clearResult();
  }

  function continueToNextChallenge() {
    if (!activeChallenge?.nextChallengeId) {
      return;
    }

    activateChallenge(activeChallenge.nextChallengeId);
    setMobileView("mission");
  }

  return (
    <main className="lab-shell">
      <header className="topbar">
        <div className="brand-lockup">
          <span className="brand-mark" aria-hidden="true">CKB</span>
          <span>
            <strong>Builder Lab</strong>
            <small>Cell model workbench</small>
          </span>
        </div>

        <div className="topbar-progress" aria-label="Learning path progress">
          <span>Cell model</span>
          <div>
            <i
              style={{
                width: `${(completedChallengeIds.length / initialChallenges.length) * 100}%`,
              }}
            />
          </div>
          <strong>{completedChallengeIds.length}/{initialChallenges.length}</strong>
        </div>

        <div className="topbar-actions">
          <button
            type="button"
            className="tutor-button"
            onClick={() => setTourRestartToken((current) => current + 1)}
          >
            <GraduationCap size={16} aria-hidden="true" />
            <span>Cell Guide</span>
          </button>
          <details className="model-disclosure">
            <summary>
              <Info size={15} aria-hidden="true" />
              <span>Educational model</span>
            </summary>
            <p>
              Witnesses and type rules are simplified for learning. This lab does not
              connect to a node, wallet, signature system, or the CKB-VM.
            </p>
          </details>
        </div>
      </header>

      <nav className="mobile-nav" aria-label="Workspace views">
        <button
          type="button"
          className={mobileView === "mission" ? "is-active" : ""}
          onClick={() => setMobileView("mission")}
        >
          <BookOpen size={17} aria-hidden="true" />
          Mission
        </button>
        <button
          type="button"
          className={mobileView === "cells" ? "is-active" : ""}
          onClick={() => setMobileView("cells")}
        >
          <Boxes size={17} aria-hidden="true" />
          Cells
        </button>
        <button
          type="button"
          className={mobileView === "build" ? "is-active" : ""}
          onClick={() => setMobileView("build")}
        >
          <SlidersHorizontal size={17} aria-hidden="true" />
          Build
        </button>
        <button
          type="button"
          className={mobileView === "result" ? "is-active" : ""}
          onClick={() => setMobileView("result")}
        >
          <CheckCircle2 size={17} aria-hidden="true" />
          Result
        </button>
      </nav>

      <div className="lab-workbench" data-mobile-view={mobileView}>
        <LearningRail
          challenges={initialChallenges}
          activeChallenge={activeChallenge}
          completedChallengeIds={completedChallengeIds}
          evaluation={challengeEvaluation}
          revealedHintCount={revealedHintCount}
          onSelectChallenge={(challengeId) => {
            activateChallenge(challengeId);
            setMobileView("mission");
          }}
          onOpenSandbox={openSandbox}
          onRevealHint={() =>
            setRevealedHintCount((current) =>
              Math.min(current + 1, activeChallenge?.hints.length ?? current),
            )
          }
          onContinue={continueToNextChallenge}
        />
        <CellLedger
          cells={cells}
          selectedInputIds={selectedInputIds}
          transactionMode={mode === "transaction"}
          onToggleInput={toggleInput}
        />
        <TransactionBuilder
          mode={mode}
          outputDraft={outputDraft}
          includeOutput={includeOutput}
          includeLock={includeLock}
          witnessOwners={witnessOwners}
          onModeChange={setModeAndCleanSelection}
          onOutputChange={updateOutputDraft}
          onIncludeOutputChange={setOutputIncluded}
          onIncludeLockChange={toggleLock}
          onWitnessToggle={toggleWitness}
        />
        <SimulationResultPanel
          selectedInputs={selectedInputCells}
          outputDrafts={outputDrafts}
          result={lastResult}
        />
      </div>

      <footer className="command-dock" aria-label="Simulator actions">
        <div className="draft-status">
          <span className={`status-dot ${lastResult?.ok ? "success" : lastResult ? "error" : ""}`} />
          <span>
            <strong>{mode === "transaction" ? "Transaction" : "Genesis"}</strong>
            <small>
              {selectedInputIds.length} input / {outputDrafts.length} output
            </small>
          </span>
        </div>
        <div className="dock-actions">
          <button
            className="dock-icon-button"
            type="button"
            onClick={clearDraft}
            aria-label="Clear transaction draft"
            title="Clear draft"
          >
            <Eraser size={18} aria-hidden="true" />
          </button>
          <button
            className="dock-icon-button"
            type="button"
            onClick={reset}
            aria-label="Reset current workspace"
            title="Reset workspace"
          >
            <RotateCcw size={18} aria-hidden="true" />
          </button>
          <button className="simulate-button" type="button" onClick={simulate}>
            <Play size={18} fill="currentColor" aria-hidden="true" />
            Simulate
          </button>
          <button
            className="apply-button"
            type="button"
            disabled={!lastResult?.ok || !lastResult.after || resultApplied}
            onClick={applyResult}
          >
            <Save size={18} aria-hidden="true" />
            {resultApplied ? "Applied" : "Apply"}
          </button>
        </div>
      </footer>

      <GuidedTour
        restartToken={tourRestartToken}
        onMobileViewChange={setMobileView}
      />
    </main>
  );
}
