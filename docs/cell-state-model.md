# Cell State Model

## Reference Model

In CKB, a Cell is the fundamental state unit:

```ts
Cell = {
  capacity: HexString;
  lock: Script;
  type: Script | null;
  data: HexString;
}
```

A transaction destroys previously live Cells used as inputs and creates new
Cells as outputs.

## Educational MVP Model

The MVP uses a typed teaching model that maps directly to CKB concepts while
remaining simple enough for browser-based interaction.

```ts
type Cell = {
  id: string;
  capacity: number;
  lock: LockScript;
  type: TypeScriptRule | null;
  data: string;
  status: "live" | "consumed";
};
```

### Capacity

Capacity is represented in CKBytes for the beginner simulator.

Rules:

- capacity must be greater than 0
- capacity must be at least the estimated occupied bytes
- beginner examples should default to 100 CKBytes
- the minimum beginner Cell should be 61 CKBytes

The simulator should show why 61 CKBytes is the minimum base case:

- 8 bytes for capacity
- 32 bytes for lock code hash
- 20 bytes for lock args
- 1 byte for hash type

### Lock Script

The MVP lock script represents ownership.

```ts
type LockScript = {
  kind: "owner-lock";
  owner: "Alice" | "Bob" | "Carol" | string;
};
```

Validation:

- each input Cell must have an unlocking witness from its owner
- if a Cell is locked by Alice, the transaction must include Alice as a signer

This stands in for real CKB lock script execution and signature verification.

### Type Script

The MVP type script is optional and represented as a named educational rule.

```ts
type TypeScriptRule =
  | { kind: "none" }
  | { kind: "immutable-data" }
  | { kind: "counter"; direction: "increment" | "decrement" };
```

Rules:

- `none`: no state transition constraint
- `immutable-data`: matching input and output type scripts must preserve data
- `counter`: matching input and output type scripts must change numeric data by
  exactly 1 in the configured direction

This lets learners see how type scripts constrain Cell transformation without
requiring real VM execution in the first milestone.

## Ledger State

The simulator maintains a local ledger:

```ts
type LedgerState = {
  cells: Record<string, Cell>;
};
```

Rules:

- live Cells are available as transaction inputs
- consumed Cells remain visible in history but cannot be reused
- successful transactions mark input Cells consumed and append output Cells
- failed transactions do not change ledger state

## Draft Transaction

```ts
type DraftTransaction = {
  inputs: string[];
  outputs: DraftCellOutput[];
  witnesses: Witness[];
};
```

The user builds a transaction by selecting input Cells and defining output
Cells.

## Validation Rules

The first simulator should validate in this order:

1. At least one input exists for state transition challenges.
2. At least one output exists.
3. Every input references a known live Cell.
4. Every output has capacity greater than 0.
5. Every output has a lock script.
6. Every output has enough capacity for its estimated occupied bytes.
7. Input capacity is greater than or equal to output capacity.
8. Every input lock is satisfied by a matching witness.
9. Type script transition rules pass.

The simulator should return all relevant errors, not just the first one, when
that does not confuse the learner.

## Simulation Result

```ts
type SimulationResult = {
  ok: boolean;
  transaction: DraftTransaction;
  before: LedgerState;
  after: LedgerState | null;
  trace: ValidationTraceEvent[];
  errors: ValidationError[];
};
```

The trace is as important as the pass/fail result. It is the educational layer
that explains what happened.

## Initial Scenarios

### Create First Cell

Purpose: teach Cell fields.

Behavior:

- user creates an output Cell with no input
- simulator validates positive capacity and lock presence
- result creates a live Cell in local state

Note: this is an educational "genesis" action. The UI must label it as a
teaching shortcut, not a normal CKB transaction.

### Execute State Transition

Purpose: teach consumption and replacement.

Behavior:

- user selects one live input Cell
- user creates one output Cell
- successful transaction consumes the input and creates the output

### Transfer Ownership

Purpose: teach lock scripts.

Behavior:

- input Cell is locked by Alice
- transaction includes Alice witness
- output Cell is locked by Bob
- challenge passes when owner changes

