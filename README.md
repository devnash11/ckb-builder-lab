# CKB Builder Lab

Interactive developer onboarding infrastructure for the CKB ecosystem.

CKB Builder Lab teaches developers the CKB Cell Model through browser-based
simulations, guided learning paths, and automatically verified challenges.

This folder contains the Week 1 architecture plan for the approved Spark
Program MVP. It is intentionally separate from the docs.nervos.org codebase;
the surrounding repository is used only as local reference material for CKB
concepts.

## Spark MVP Scope

The first Spark phase focuses on the Cell Model:

- Cells as the fundamental state unit
- capacity as storage and value constraint
- lock scripts as ownership rules
- type scripts as state transition rules
- transactions as Cell consumption and Cell creation
- beginner challenges with automatic validation

Out of scope for the first MVP:

- full CKB node behavior
- real signature verification
- real VM script execution
- wallet integration
- RGB++, xUDT, Fiber, or cross-chain flows

## Week 1 Deliverables

Week 1 is architecture design. The goal is to remove ambiguity before building
the simulation engine.

- [docs/architecture.md](docs/architecture.md) defines the system architecture.
- [docs/cell-state-model.md](docs/cell-state-model.md) defines the educational
  Cell and transaction model.
- [docs/challenge-framework.md](docs/challenge-framework.md) defines challenge
  structure and validation.
- [docs/learning-flow.md](docs/learning-flow.md) defines the beginner learning
  path.
- [docs/week-1-plan.md](docs/week-1-plan.md) captures the completed Week 1
  plan and Week 2 handoff.
- [src/simulator/types.ts](src/simulator/types.ts) provides initial simulator
  TypeScript contracts.
- [src/challenges/types.ts](src/challenges/types.ts) provides initial challenge
  TypeScript contracts.

## Suggested Implementation Stack

- Next.js
- React
- TypeScript
- deterministic TypeScript state machine for simulation
- local browser state for MVP progress
- optional API/Supabase persistence after the browser MVP is usable

## Reference Sources

The Week 1 model is based on the CKB docs in this workspace:

- `website/docs/tech-explanation/cell.md`
- `website/docs/tech-explanation/transaction.md`
- `website/docs/tech-explanation/capacity.md`
- `website/docs/tech-explanation/lock-script.md`
- `website/docs/tech-explanation/type-script.mdx`

