# Architecture

## Product Goal

CKB Builder Lab helps developers build a correct mental model of CKB before
they start writing production code. The MVP is an interactive browser app where
users manipulate simplified CKB Cells, simulate transactions, and complete
automatically verified challenges.

The simulator should be educational, deterministic, and explicit about what is
real CKB behavior versus simplified teaching behavior.

## System Shape

```text
Developer
  |
  v
Next.js App
  |
  +-- Learning UI
  |     |
  |     +-- lesson steps
  |     +-- explanations
  |     +-- challenge prompts
  |
  +-- Simulator UI
  |     |
  |     +-- Cell editor
  |     +-- transaction builder
  |     +-- validation timeline
  |     +-- before/after visualization
  |
  +-- Simulator Engine
  |     |
  |     +-- Cell state model
  |     +-- transaction state machine
  |     +-- validation rules
  |     +-- explanatory traces
  |
  +-- Challenge Engine
        |
        +-- challenge definitions
        +-- rule checks
        +-- completion state
        +-- feedback messages
```

## Main Modules

### Learning UI

Owns the user-facing journey. It presents short lessons, then pushes the user
into the simulator to complete a task.

Responsibilities:

- show current lesson and concept summary
- display the current challenge
- explain simulator outcomes in beginner-friendly language
- show challenge completion state

Non-responsibilities:

- validating CKB rules directly
- persisting long-term progress in Week 1 or Week 2

### Simulator UI

Owns interaction with Cells and transactions.

Responsibilities:

- render Cell fields
- let users edit capacity, lock owner, type rule, and data
- let users choose input Cells and output Cells
- trigger simulation
- render validation trace and transaction result

Non-responsibilities:

- deciding whether a transaction is valid
- deciding whether a challenge is complete

### Simulator Engine

Owns the educational CKB model.

Responsibilities:

- represent Cells and transactions
- run deterministic validations
- produce pass/fail results
- produce explanatory trace events
- return a new ledger state when a transaction succeeds

Non-responsibilities:

- connecting to a CKB node
- executing real RISC-V VM scripts
- verifying real cryptographic signatures

### Challenge Engine

Owns learning task verification.

Responsibilities:

- define challenge metadata
- evaluate simulator state and transaction results
- return pass/fail with actionable feedback
- track per-session completion

Non-responsibilities:

- simulating transactions
- storing permanent user accounts in the MVP

## Data Flow

```text
User edits Cells
  -> Simulator UI builds DraftTransaction
  -> Simulator Engine validates DraftTransaction
  -> Engine returns SimulationResult
  -> UI renders trace and updated state preview
  -> Challenge Engine evaluates SimulationResult
  -> UI renders challenge status and next step
```

## Persistence Decision

For the MVP, use browser-local persistence first:

- current lesson
- challenge completion
- last simulator state

Reasoning:

- no account system is needed to prove the learning flow
- it lowers implementation risk for the Spark timeline
- Supabase can be added later without changing simulator rules

Use Supabase only if the team decides public progress tracking or testing
analytics are required during the Spark period.

## Accuracy Boundary

The MVP should model CKB concepts accurately enough for onboarding, while being
honest about simplifications.

Accurate concepts:

- a Cell stores capacity, lock, optional type, and data
- a transaction consumes input Cells and creates output Cells
- consumed Cells cannot be used again
- capacity must be positive and sufficient for occupied storage
- lock scripts represent ownership and unlocking authority
- type scripts constrain valid state transitions

Simplified concepts:

- lock script validation is represented by owner/witness matching
- type script validation is represented by named educational rules
- occupied capacity is approximated by deterministic byte estimates
- transaction fees are optional in the first module
- cell deps, header deps, since, and real witnesses are deferred

## Week 2 Build Target

Week 2 should implement the simulator engine first, independent of UI:

- construct Cells
- construct draft transactions
- validate input/output presence
- validate input Cells are live
- validate capacity conservation
- validate occupied capacity
- validate educational lock ownership
- apply successful transaction to ledger state
- return explanatory validation trace

