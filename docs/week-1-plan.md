# Week 1 Plan

## Milestone

Simulation architecture completed.

## Week 1 Objectives

- define simulator architecture
- design Cell state model
- define challenge framework
- create beginner learning flow
- prepare Week 2 implementation handoff

## Completed Architecture Decisions

### 1. Product Shape

Build a browser-based interactive simulator with a guided challenge layer.

The MVP should not try to be a full CKB development environment. It should be a
learning bridge that prepares users to understand docs, SDK examples, Cell
Sandbox, and real app development.

### 2. Simulator Boundary

Use an educational CKB model:

- accurate for core Cell lifecycle concepts
- simplified for scripts, witnesses, fees, and real chain validation
- deterministic and explainable

Every simplification should be visible in docs or UI copy.

### 3. State Model

Use a local ledger of Cells.

Cells have:

- `id`
- `capacity`
- `lock`
- optional `type`
- `data`
- `status`

Transactions have:

- input Cell IDs
- output Cell drafts
- witnesses

Successful simulations consume inputs and create outputs. Failed simulations do
not change state.

### 4. Validation Model

Validation is rule-based and traceable.

Initial rules:

- known live inputs
- output exists
- positive capacity
- lock script exists
- capacity covers estimated occupied bytes
- output capacity does not exceed input capacity
- lock owner witness exists
- educational type rules pass

### 5. Challenge Model

Challenges are structured definitions evaluated against simulator results.

Initial MVP challenge set:

- Create Your First Cell
- Execute State Transition
- Transfer Ownership

Stretch challenges:

- Add a Type Rule
- Fix a Failed Transaction

### 6. Persistence

Start with local browser storage for progress and simulator state.

Backend persistence is deferred until the learning loop proves useful.

### 7. Application Framework

Use Next.js for the MVP.

Reasoning:

- matches the approved proposal stack
- supports React and TypeScript cleanly
- leaves room for lightweight API routes if progress, testing feedback, or
  demo telemetry are added later
- deploys naturally to Vercel

## Week 2 Handoff

Week 2 should implement the simulator engine as a framework-independent
TypeScript module inside a Next.js app.

Recommended task order:

1. Add package setup for a Next.js prototype.
2. Implement simulator domain types.
3. Implement Cell factory helpers.
4. Implement occupied capacity estimation.
5. Implement transaction validation.
6. Implement transaction application to ledger state.
7. Add unit tests for valid and invalid transactions.
8. Expose trace events for UI rendering.

## Week 2 Acceptance Criteria

By the end of Week 2, the team should be able to run tests proving:

- a valid Cell can be created in educational genesis mode
- a valid transaction consumes one live Cell and creates one output Cell
- a consumed Cell cannot be reused
- an output without capacity fails
- an output without lock owner fails
- a transaction without the required owner witness fails
- ownership transfer from Alice to Bob succeeds
- failed transactions leave ledger state unchanged

## Risks

### Simulator Accuracy Drift

Risk: learners may confuse simplified rules with real CKB protocol behavior.

Mitigation: label educational shortcuts and maintain a "real CKB vs simulator"
note in the UI/docs.

### UI Before Engine

Risk: building screens first may hide unclear validation behavior.

Mitigation: build and test the simulator engine before polishing UI.

### Challenge Vagueness

Risk: challenges may pass without proving the intended concept.

Mitigation: each challenge must include explicit success criteria tied to
simulation results.

## Open Questions

- Should capacity be displayed as CKBytes only, or both CKBytes and shannons?
- Should type scripts appear in the first public demo, or remain a stretch
  module after the first three challenges?
- How many developers will participate in Week 6 testing?

## Closed Questions

- Framework: Next.js.
