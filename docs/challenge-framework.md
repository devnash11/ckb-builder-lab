# Challenge Framework

## Goal

The challenge system turns learning objectives into verifiable simulator tasks.
It should reward correct practical actions instead of passive reading.

## Challenge Definition

```ts
type ChallengeDefinition = {
  id: string;
  title: string;
  concept: string;
  prompt: string;
  setup: ChallengeSetup;
  successCriteria: ChallengeCriterion[];
  hints: string[];
  nextChallengeId?: string;
};
```

Each challenge owns:

- initial simulator state
- learner task
- validation criteria
- feedback messages
- next challenge relationship

## Challenge Lifecycle

```text
Not started
  -> Started
  -> Submitted
  -> Passed | Failed
  -> Completed
```

Failed submissions should keep the user's simulator state intact so they can
fix it without starting over.

## Validation Inputs

The challenge engine receives:

- challenge definition
- current ledger state
- latest draft transaction
- latest simulation result
- user progress state

It should not duplicate simulator transaction validation. Instead, it should ask
domain-specific questions about the already simulated result.

## Validation Output

```ts
type ChallengeEvaluation = {
  passed: boolean;
  messages: ChallengeMessage[];
  completedCriteria: string[];
  failedCriteria: string[];
};
```

Messages should be specific:

- "The Cell needs a lock script."
- "The input Cell was not consumed because the transaction failed."
- "Ownership changed from Alice to Bob."

Avoid vague messages:

- "Invalid transaction."
- "Try again."

## MVP Challenges

### Challenge 1: Create Your First Cell

Concept: Cell structure.

Setup:

- empty educational ledger
- Cell editor open

Task:

- create a valid Cell

Success criteria:

- simulation succeeds
- at least one live Cell exists after simulation
- created Cell has capacity greater than 0
- created Cell has a lock owner
- created Cell has data, even if empty

Feedback examples:

- pass: "A live Cell was created with capacity, ownership, and data."
- fail: "A valid Cell needs positive capacity and a lock owner."

### Challenge 2: Execute State Transition

Concept: Cells are consumed and recreated through transactions.

Setup:

- one live Cell owned by Alice
- capacity: 100 CKBytes
- data: `Hello`

Task:

- consume the existing Cell and create a replacement Cell

Success criteria:

- transaction simulation succeeds
- one input Cell is consumed
- at least one output Cell is created
- output Cell is live
- input and output Cell IDs are different

Feedback examples:

- pass: "The original Cell was consumed and a new live Cell replaced it."
- fail: "Select a live input Cell and create at least one output Cell."

### Challenge 3: Transfer Ownership

Concept: lock scripts define ownership.

Setup:

- one live Cell locked by Alice
- Alice witness available

Task:

- create a transaction that transfers ownership from Alice to Bob

Success criteria:

- transaction simulation succeeds
- input owner is Alice
- output owner is Bob
- input owner and output owner are different

Feedback examples:

- pass: "Ownership changed from Alice to Bob through the output lock script."
- fail: "The output Cell still has the same owner as the input Cell."

## Challenge Ordering

1. Create Your First Cell
2. Execute State Transition
3. Transfer Ownership
4. Add a Type Rule
5. Fix a Failed Transaction

Only the first three are required for the Spark MVP if timeline pressure appears.

## Progress Storage

Use local browser storage in the MVP:

```ts
type ProgressState = {
  completedChallengeIds: string[];
  activeChallengeId: string;
  lastUpdatedAt: string;
};
```

This keeps the Week 2-4 build simple. A backend can be added later for public
profiles, analytics, or cross-device progress.

