import { describe, expect, it } from "vitest";
import { estimateOccupiedCapacity } from "./capacity";
import { simulateTransaction } from "./simulate";
import type {
  DraftCellOutput,
  DraftTransaction,
  LedgerState,
  SimulationMode,
} from "./types";

const aliceCell = {
  id: "cell-alice",
  capacity: 100,
  lock: { kind: "owner-lock" as const, owner: "Alice" },
  type: null,
  data: "Hello",
  status: "live" as const,
};

function ledgerWithAliceCell(): LedgerState {
  return {
    cells: {
      [aliceCell.id]: { ...aliceCell, lock: { ...aliceCell.lock } },
    },
  };
}

function output(overrides: Partial<DraftCellOutput> = {}): DraftCellOutput {
  return {
    capacity: 100,
    lock: { kind: "owner-lock", owner: "Alice" },
    type: null,
    data: "Hello, CKB",
    ...overrides,
  };
}

function simulate(
  mode: SimulationMode,
  ledger: LedgerState,
  transaction: DraftTransaction,
) {
  return simulateTransaction({
    mode,
    ledger,
    transaction,
    idFactory: (index) => `created-${index + 1}`,
  });
}

describe("simulateTransaction", () => {
  it("creates a valid live Cell in educational genesis mode", () => {
    const result = simulate("educational-genesis", { cells: {} }, {
      inputs: [],
      outputs: [output({ data: "Hello" })],
      witnesses: [],
    });

    expect(result.ok).toBe(true);
    expect(result.after?.cells["created-1"]).toMatchObject({
      id: "created-1",
      status: "live",
      data: "Hello",
      lock: { owner: "Alice" },
    });
  });

  it("consumes one live input and creates one live output", () => {
    const result = simulate("transaction", ledgerWithAliceCell(), {
      inputs: ["cell-alice"],
      outputs: [output()],
      witnesses: [{ owner: "Alice" }],
    });

    expect(result.ok).toBe(true);
    expect(result.after?.cells["cell-alice"].status).toBe("consumed");
    expect(result.after?.cells["created-1"]).toMatchObject({
      status: "live",
      data: "Hello, CKB",
    });
  });

  it("rejects a consumed input Cell", () => {
    const ledger = ledgerWithAliceCell();
    ledger.cells["cell-alice"].status = "consumed";

    const result = simulate("transaction", ledger, {
      inputs: ["cell-alice"],
      outputs: [output()],
      witnesses: [{ owner: "Alice" }],
    });

    expect(result.ok).toBe(false);
    expect(result.errors).toContainEqual(
      expect.objectContaining({ code: "CONSUMED_INPUT" }),
    );
  });

  it("rejects an unknown input Cell", () => {
    const result = simulate("transaction", ledgerWithAliceCell(), {
      inputs: ["missing-cell"],
      outputs: [output()],
      witnesses: [{ owner: "Alice" }],
    });

    expect(result.ok).toBe(false);
    expect(result.errors).toContainEqual(
      expect.objectContaining({ code: "UNKNOWN_INPUT" }),
    );
  });

  it("rejects transaction mode without inputs", () => {
    const result = simulate("transaction", ledgerWithAliceCell(), {
      inputs: [],
      outputs: [output()],
      witnesses: [{ owner: "Alice" }],
    });

    expect(result.ok).toBe(false);
    expect(result.errors).toContainEqual(
      expect.objectContaining({ code: "NO_INPUTS" }),
    );
  });

  it("rejects a transaction without outputs", () => {
    const result = simulate("transaction", ledgerWithAliceCell(), {
      inputs: ["cell-alice"],
      outputs: [],
      witnesses: [{ owner: "Alice" }],
    });

    expect(result.ok).toBe(false);
    expect(result.errors).toContainEqual(
      expect.objectContaining({ code: "NO_OUTPUTS" }),
    );
  });

  it("rejects output with zero or negative capacity", () => {
    const result = simulate("transaction", ledgerWithAliceCell(), {
      inputs: ["cell-alice"],
      outputs: [output({ capacity: 0 }), output({ capacity: -1 })],
      witnesses: [{ owner: "Alice" }],
    });

    expect(result.ok).toBe(false);
    expect(result.errors.filter((error) => error.code === "INVALID_CAPACITY"))
      .toHaveLength(2);
  });

  it("rejects output without a lock script", () => {
    const result = simulate("transaction", ledgerWithAliceCell(), {
      inputs: ["cell-alice"],
      outputs: [output({ lock: null })],
      witnesses: [{ owner: "Alice" }],
    });

    expect(result.ok).toBe(false);
    expect(result.errors).toContainEqual(
      expect.objectContaining({ code: "MISSING_LOCK" }),
    );
  });

  it("rejects output below occupied capacity", () => {
    const result = simulate("transaction", ledgerWithAliceCell(), {
      inputs: ["cell-alice"],
      outputs: [output({ capacity: 61, data: "too much data" })],
      witnesses: [{ owner: "Alice" }],
    });

    expect(result.ok).toBe(false);
    expect(result.errors).toContainEqual(
      expect.objectContaining({ code: "INSUFFICIENT_OCCUPIED_CAPACITY" }),
    );
  });

  it("rejects output capacity greater than input capacity", () => {
    const result = simulate("transaction", ledgerWithAliceCell(), {
      inputs: ["cell-alice"],
      outputs: [output({ capacity: 101 })],
      witnesses: [{ owner: "Alice" }],
    });

    expect(result.ok).toBe(false);
    expect(result.errors).toContainEqual(
      expect.objectContaining({ code: "CAPACITY_NOT_CONSERVED" }),
    );
  });

  it("rejects a transaction without the required owner witness", () => {
    const result = simulate("transaction", ledgerWithAliceCell(), {
      inputs: ["cell-alice"],
      outputs: [output()],
      witnesses: [{ owner: "Bob" }],
    });

    expect(result.ok).toBe(false);
    expect(result.errors).toContainEqual(
      expect.objectContaining({ code: "MISSING_WITNESS" }),
    );
  });

  it("transfers ownership from Alice to Bob", () => {
    const result = simulate("transaction", ledgerWithAliceCell(), {
      inputs: ["cell-alice"],
      outputs: [output({ lock: { kind: "owner-lock", owner: "Bob" } })],
      witnesses: [{ owner: "Alice" }],
    });

    expect(result.ok).toBe(true);
    expect(result.after?.cells["created-1"].lock.owner).toBe("Bob");
  });

  it("does not mutate the original ledger when a transaction fails", () => {
    const ledger = ledgerWithAliceCell();
    const result = simulate("transaction", ledger, {
      inputs: ["cell-alice"],
      outputs: [output({ capacity: 101 })],
      witnesses: [{ owner: "Alice" }],
    });

    expect(result.ok).toBe(false);
    expect(result.after).toBeNull();
    expect(ledger.cells["cell-alice"].status).toBe("live");
  });

  it("accepts unchanged immutable-data transitions", () => {
    const ledger: LedgerState = {
      cells: {
        "typed-cell": {
          ...aliceCell,
          id: "typed-cell",
          type: { kind: "immutable-data" },
          data: "fixed",
        },
      },
    };

    const result = simulate("transaction", ledger, {
      inputs: ["typed-cell"],
      outputs: [output({ type: { kind: "immutable-data" }, data: "fixed" })],
      witnesses: [{ owner: "Alice" }],
    });

    expect(result.ok).toBe(true);
  });

  it("rejects changed immutable-data transitions", () => {
    const ledger: LedgerState = {
      cells: {
        "typed-cell": {
          ...aliceCell,
          id: "typed-cell",
          type: { kind: "immutable-data" },
          data: "fixed",
        },
      },
    };

    const result = simulate("transaction", ledger, {
      inputs: ["typed-cell"],
      outputs: [output({ type: { kind: "immutable-data" }, data: "changed" })],
      witnesses: [{ owner: "Alice" }],
    });

    expect(result.ok).toBe(false);
    expect(result.errors).toContainEqual(
      expect.objectContaining({ code: "TYPE_RULE_VIOLATION" }),
    );
  });

  it("accepts counter increment from 1 to 2", () => {
    const ledger: LedgerState = {
      cells: {
        counter: {
          ...aliceCell,
          id: "counter",
          type: { kind: "counter", direction: "increment" },
          data: "1",
        },
      },
    };

    const result = simulate("transaction", ledger, {
      inputs: ["counter"],
      outputs: [
        output({
          capacity: estimateOccupiedCapacity({
            data: "2",
            type: { kind: "counter", direction: "increment" },
          }),
          type: { kind: "counter", direction: "increment" },
          data: "2",
        }),
      ],
      witnesses: [{ owner: "Alice" }],
    });

    expect(result.ok).toBe(true);
  });

  it("rejects invalid counter increments", () => {
    const ledger: LedgerState = {
      cells: {
        counter: {
          ...aliceCell,
          id: "counter",
          type: { kind: "counter", direction: "increment" },
          data: "1",
        },
      },
    };

    const result = simulate("transaction", ledger, {
      inputs: ["counter"],
      outputs: [
        output({
          type: { kind: "counter", direction: "increment" },
          data: "3",
        }),
      ],
      witnesses: [{ owner: "Alice" }],
    });

    expect(result.ok).toBe(false);
    expect(result.errors).toContainEqual(
      expect.objectContaining({ code: "TYPE_RULE_VIOLATION" }),
    );
  });
});
