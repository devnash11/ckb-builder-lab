# Week 1 Final Evidence: CKB Builder Lab

Hello everyone,

This is the Week 1 progress report for **CKB Builder Lab**, our approved Spark
Program project focused on interactive developer onboarding infrastructure for
the CKB ecosystem.

## Week 1 Milestone

The Week 1 milestone was:

**Simulation architecture completed.**

The planned Week 1 tasks were:

- define simulator architecture
- design the Cell state model
- define the challenge framework
- create the beginner learning flow
- prepare the implementation handoff for Week 2

These Week 1 tasks have been completed.

## What We Completed

### 1. Project Structure

We created a dedicated project folder for CKB Builder Lab:

```text
ckb-builder-lab/
```

This folder is separate from the Nervos documentation workspace. The
documentation workspace is only being used as reference material for CKB
concepts such as Cells, transactions, capacity, lock scripts, and type scripts.

The Week 1 folder now contains:

```text
ckb-builder-lab/
  README.md
  docs/
    architecture.md
    cell-state-model.md
    challenge-framework.md
    learning-flow.md
    week-1-plan.md
    week-1-final-evidence-forum-post.md
  src/
    simulator/
      types.ts
    challenges/
      types.ts
    content/
      initial-challenges.ts
```

### 2. Simulator Architecture

We defined the high-level architecture for the browser-based simulator.

The system is structured around four main parts:

- Learning UI
- Simulator UI
- Simulator Engine
- Challenge Engine

The intended flow is:

```text
User edits Cells
  -> Simulator UI builds a draft transaction
  -> Simulator Engine validates the transaction
  -> Engine returns a simulation result and validation trace
  -> UI renders before/after Cell state
  -> Challenge Engine checks whether the learning task was completed
```

The simulator will be deterministic and educational. It will focus on helping
developers understand CKB's Cell Model rather than trying to reproduce the full
CKB node, VM, or transaction pool.

The architecture document also defines the accuracy boundary for the MVP.

The simulator will model these CKB concepts:

- a Cell stores capacity, lock, optional type, and data
- transactions consume input Cells and create output Cells
- consumed Cells cannot be reused
- capacity must be positive and sufficient for occupied storage
- lock scripts represent ownership and unlocking authority
- type scripts constrain valid state transitions

The MVP will simplify:

- real signature verification
- real RISC-V VM script execution
- full witness structure
- cell deps and header deps
- transaction fee handling
- real node submission

These simplifications will be made clear in the learning experience so users do
not confuse the educational simulator with full protocol execution.

### 3. Cell State Model

We designed the first educational Cell model.

The MVP Cell model contains:

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

This maps directly to the CKB concepts from the official docs:

- `capacity`
- `lock`
- `type`
- `data`

For the beginner simulator, capacity will be displayed in CKBytes. The model
also includes the 61 CKByte minimum base concept, based on the capacity
documentation:

- 8 bytes for capacity
- 32 bytes for lock code hash
- 20 bytes for lock args
- 1 byte for hash type

The MVP lock script model represents ownership:

```ts
type LockScript = {
  kind: "owner-lock";
  owner: "Alice" | "Bob" | "Carol" | string;
};
```

This lets the simulator teach that a Cell is controlled by a lock script. In
the MVP, unlocking is represented by matching the input owner with a witness.
This is a teaching abstraction for real CKB lock script and signature
verification.

The MVP type script model is optional and represented as named educational
rules:

```ts
type TypeScriptRule =
  | { kind: "none" }
  | { kind: "immutable-data" }
  | { kind: "counter"; direction: "increment" | "decrement" };
```

This gives us a way to teach that type scripts constrain state transitions
without needing real VM execution in the first milestone.

### 4. Transaction and Ledger Model

We defined a local educational ledger:

```ts
type LedgerState = {
  cells: Record<string, Cell>;
};
```

The simulator treats Cells as either:

- `live`
- `consumed`

A draft transaction contains:

```ts
type DraftTransaction = {
  inputs: string[];
  outputs: DraftCellOutput[];
  witnesses: Witness[];
};
```

The transaction model follows the key CKB idea that a transaction destroys
previous live Cells used as inputs and creates new Cells as outputs.

Successful simulations will:

- mark input Cells as consumed
- create new live output Cells
- return an explanatory validation trace

Failed simulations will:

- leave the ledger unchanged
- return validation errors
- explain why the transaction failed

### 5. Validation Rules

We defined the first simulator validation rules.

The simulator should validate:

- at least one input exists for state transition challenges
- at least one output exists
- every input references a known live Cell
- every output has positive capacity
- every output has a lock script
- every output has enough capacity for its estimated occupied bytes
- input capacity is greater than or equal to output capacity
- every input lock is satisfied by a matching witness
- educational type script transition rules pass

The simulator will return both:

- pass/fail result
- human-readable validation trace

The validation trace is important because the project is not only checking
transactions; it is teaching the developer why a transaction succeeds or fails.

### 6. Challenge Framework

We defined the challenge system that will sit on top of the simulator.

Each challenge will include:

- challenge ID
- title
- concept
- prompt
- setup state
- success criteria
- hints
- next challenge relationship

The challenge lifecycle is:

```text
Not started
  -> Started
  -> Submitted
  -> Passed | Failed
  -> Completed
```

The Challenge Engine will not duplicate the simulator. Instead, it will evaluate
the latest simulator result and check whether the learner completed the
intended task.

### 7. Initial MVP Challenges

We defined the first three MVP challenges.

#### Challenge 1: Create Your First Cell

Concept:

- Cell structure

Task:

- create a valid Cell

Validation:

- simulation succeeds
- at least one live Cell exists after simulation
- created Cell has capacity greater than 0
- created Cell has a lock owner
- created Cell has data, even if empty

#### Challenge 2: Execute State Transition

Concept:

- Cells are consumed and recreated through transactions

Task:

- consume one existing Cell and create a replacement Cell

Validation:

- transaction simulation succeeds
- one input Cell is consumed
- at least one output Cell is created
- output Cell is live
- input and output Cell IDs are different

#### Challenge 3: Transfer Ownership

Concept:

- lock scripts define Cell ownership

Task:

- transfer a Cell from Alice to Bob

Validation:

- transaction simulation succeeds
- input owner is Alice
- output owner is Bob
- input owner and output owner are different

We also identified two stretch challenges:

- Add a Type Rule
- Fix a Failed Transaction

### 8. Learning Flow

We created the first beginner learning path.

The path is designed for developers who may understand Ethereum, Solana, or
general blockchain concepts but are new to CKB.

The learning path is:

```text
1. What is a Cell?
   -> inspect fields
   -> create a first Cell
   -> complete Challenge 1

2. How does state change?
   -> compare account mutation with Cell replacement
   -> consume one Cell
   -> create one output Cell
   -> complete Challenge 2

3. Who owns a Cell?
   -> inspect lock script
   -> provide owner witness
   -> change output lock owner
   -> complete Challenge 3

4. What does capacity mean?
   -> inspect occupied capacity
   -> trigger insufficient capacity failure
   -> fix capacity

5. What can type scripts enforce?
   -> attach a simple rule
   -> try valid and invalid data transitions
```

The proposed MVP screen model uses one main interface with three areas:

- lesson and challenge prompt
- Cell and transaction editor
- validation trace and before/after state

This is intended to keep the learner focused on connecting the concept,
interaction, and result in one place.

### 9. Technical Direction

We confirmed that the MVP will use:

- Next.js
- React
- TypeScript
- deterministic TypeScript state machine for simulation
- local browser storage for MVP progress
- optional API routes or Supabase later if needed
- Vercel deployment

We also added initial TypeScript contracts for:

- simulator types
- challenge types
- initial challenge content

These are not the full Week 2 implementation yet, but they define the shape
that Week 2 will build from.

## Files Produced

The main Week 1 files are:

- `ckb-builder-lab/README.md`
- `ckb-builder-lab/docs/architecture.md`
- `ckb-builder-lab/docs/cell-state-model.md`
- `ckb-builder-lab/docs/challenge-framework.md`
- `ckb-builder-lab/docs/learning-flow.md`
- `ckb-builder-lab/docs/week-1-plan.md`
- `ckb-builder-lab/src/simulator/types.ts`
- `ckb-builder-lab/src/challenges/types.ts`
- `ckb-builder-lab/src/content/initial-challenges.ts`

## Week 1 Acceptance Status

The Week 1 milestone is complete.

Completed:

- simulator architecture
- Cell state model
- transaction and local ledger model
- validation rule plan
- challenge framework
- first three MVP challenge definitions
- beginner learning flow
- Next.js implementation decision
- Week 2 handoff plan

## Week 2 Plan

Week 2 will focus on simulator engine development.

The Week 2 tasks are:

1. Set up the Next.js prototype.
2. Implement simulator domain types.
3. Implement Cell factory helpers.
4. Implement occupied capacity estimation.
5. Implement transaction validation.
6. Implement transaction application to local ledger state.
7. Add unit tests for valid and invalid transactions.
8. Return explanatory trace events for UI rendering.

By the end of Week 2, we should be able to prove through tests that:

- a valid Cell can be created in educational genesis mode
- a valid transaction consumes one live Cell and creates one output Cell
- a consumed Cell cannot be reused
- an output without capacity fails
- an output without lock owner fails
- a transaction without the required owner witness fails
- ownership transfer from Alice to Bob succeeds
- failed transactions leave ledger state unchanged

## Current Risks and Mitigations

### Risk: Simulator Accuracy Drift

Learners may confuse simplified educational behavior with real CKB protocol
behavior.

Mitigation:

- label educational shortcuts clearly
- document what is simplified
- keep the simulator focused on concept learning, not protocol replacement

### Risk: Building UI Before Rules Are Clear

A polished interface could hide unclear simulator behavior.

Mitigation:

- implement and test the simulator engine before polishing the UI
- keep validation rules traceable and explicit

### Risk: Challenge Completion Too Vague

A challenge might pass without proving the learner understood the intended
concept.

Mitigation:

- each challenge has explicit success criteria
- challenge validation is based on simulator state and simulation result
- feedback messages explain what passed or failed

## Remaining Open Questions

These items are not blockers for Week 2:

- Should capacity be displayed only as CKBytes, or as both CKBytes and shannons?
- Should type scripts appear in the first public demo, or remain a stretch
  module after the first three challenges?
- How many developers will participate in Week 6 user testing?

## Summary

Week 1 is complete. We now have a clear architecture and implementation plan for
CKB Builder Lab's first MVP module.

The project is ready to move into Week 2, where we will implement the simulator
engine inside a Next.js + TypeScript prototype.

