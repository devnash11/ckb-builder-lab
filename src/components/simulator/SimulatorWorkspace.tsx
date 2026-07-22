"use client";

import { useMemo, useRef, useState } from "react";
import type {
  Cell,
  DraftCellOutput,
  LedgerState,
  OwnerName,
  SimulationMode,
  SimulationResult,
} from "../../simulator";
import { simulateTransaction } from "../../simulator";
import { CellLedger } from "./CellLedger";
import { ownerOptions, typeRuleFromOption } from "./format";
import { SimulationResultPanel } from "./SimulationResultPanel";
import { TransactionBuilder } from "./TransactionBuilder";

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

export function SimulatorWorkspace() {
  const nextCellNumber = useRef(1);
  const [ledger, setLedger] = useState<LedgerState>(() => createStarterLedger());
  const [selectedInputIds, setSelectedInputIds] = useState<string[]>([
    "starter-alice-cell",
  ]);
  const [mode, setMode] = useState<SimulationMode>("transaction");
  const [outputDraft, setOutputDraft] = useState<DraftCellOutput>(() =>
    createStarterOutput(),
  );
  const [includeOutput, setIncludeOutput] = useState(true);
  const [includeLock, setIncludeLock] = useState(true);
  const [witnessOwners, setWitnessOwners] = useState<OwnerName[]>(["Alice"]);
  const [lastResult, setLastResult] = useState<SimulationResult | null>(null);
  const [resultApplied, setResultApplied] = useState(false);

  const cells = useMemo(
    () => Object.values(ledger.cells).sort((left, right) => left.id.localeCompare(right.id)),
    [ledger],
  );
  const selectedInputCells = selectedInputIds.flatMap((cellId) => {
    const cell = ledger.cells[cellId];
    return cell ? [cell] : [];
  });
  const outputDrafts = includeOutput ? [outputDraft] : [];

  function setModeAndCleanSelection(nextMode: SimulationMode) {
    setMode(nextMode);
    setLastResult(null);
    setResultApplied(false);

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
    setLastResult(null);
    setResultApplied(false);
  }

  function updateOutputDraft(nextOutput: DraftCellOutput) {
    setOutputDraft(includeLock ? nextOutput : { ...nextOutput, lock: null });
    setLastResult(null);
    setResultApplied(false);
  }

  function toggleLock(nextIncludeLock: boolean) {
    setIncludeLock(nextIncludeLock);
    setOutputDraft((current) => ({
      ...current,
      lock: nextIncludeLock
        ? { kind: "owner-lock", owner: current.lock?.owner ?? "Alice" }
        : null,
    }));
    setLastResult(null);
    setResultApplied(false);
  }

  function toggleWitness(owner: OwnerName) {
    setWitnessOwners((current) =>
      current.includes(owner)
        ? current.filter((currentOwner) => currentOwner !== owner)
        : [...current, owner],
    );
    setLastResult(null);
    setResultApplied(false);
  }

  function simulate() {
    const result = simulateTransaction({
      mode,
      ledger,
      transaction: {
        inputs: mode === "transaction" ? selectedInputIds : [],
        outputs: outputDrafts,
        witnesses:
          mode === "transaction"
            ? witnessOwners.map((owner) => ({ owner }))
            : [],
      },
      idFactory: (index) => `ui-cell-${nextCellNumber.current + index}`,
    });

    setLastResult(result);
    setResultApplied(false);
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
  }

  function reset() {
    nextCellNumber.current = 1;
    setLedger(createStarterLedger());
    setSelectedInputIds(["starter-alice-cell"]);
    setMode("transaction");
    setOutputDraft(createStarterOutput());
    setIncludeOutput(true);
    setIncludeLock(true);
    setWitnessOwners(["Alice"]);
    setLastResult(null);
    setResultApplied(false);
  }

  function clearDraft() {
    setOutputDraft({
      capacity: 0,
      lock: includeLock ? { kind: "owner-lock", owner: "Alice" } : null,
      type: typeRuleFromOption("none"),
      data: "",
    });
    setIncludeOutput(false);
    setLastResult(null);
    setResultApplied(false);
  }

  function setOutputIncluded(nextIncludeOutput: boolean) {
    setIncludeOutput(nextIncludeOutput);
    if (nextIncludeOutput && outputDraft.capacity <= 0) {
      setOutputDraft(createStarterOutput());
      setIncludeLock(true);
    }
    setLastResult(null);
    setResultApplied(false);
  }

  return (
    <main className="simulator-main">
      <header className="app-header">
        <div>
          <p className="eyebrow">Week 3 Interactive Simulator</p>
          <h1>CKB Builder Lab</h1>
          <p>
            Build a draft transaction, run the educational CKB Cell simulator,
            then apply valid results to see live Cells become consumed and new
            Cells appear.
          </p>
        </div>
        <div className="accuracy-note">
          Lock witnesses and type rules are simplified for onboarding. No real
          CKB node, wallet, signature, or VM execution is used in this milestone.
        </div>
      </header>

      <div className="simulator-grid">
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
          canApply={Boolean(lastResult?.ok && lastResult.after)}
          applied={resultApplied}
          onModeChange={setModeAndCleanSelection}
          onOutputChange={updateOutputDraft}
          onIncludeOutputChange={setOutputIncluded}
          onIncludeLockChange={toggleLock}
          onWitnessToggle={toggleWitness}
          onSimulate={simulate}
          onApply={applyResult}
          onReset={reset}
          onClearDraft={clearDraft}
        />
        <SimulationResultPanel
          selectedInputs={selectedInputCells}
          outputDrafts={outputDrafts}
          result={lastResult}
        />
      </div>
    </main>
  );
}
