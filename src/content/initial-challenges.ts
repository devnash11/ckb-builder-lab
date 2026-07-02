import type { ChallengeDefinition } from "../challenges/types";

const emptyLedger = {
  cells: {},
};

export const initialChallenges: ChallengeDefinition[] = [
  {
    id: "create-first-cell",
    title: "Create Your First Cell",
    concept: "Cell structure",
    prompt: "Create a valid Cell with capacity, ownership, and data.",
    setup: {
      ledger: emptyLedger,
      draftTransaction: {
        inputs: [],
        outputs: [
          {
            capacity: 100,
            lock: { kind: "owner-lock", owner: "Alice" },
            type: null,
            data: "Hello",
          },
        ],
        witnesses: [],
      },
    },
    successCriteria: [
      {
        id: "simulation-succeeds",
        label: "Simulation succeeds",
        description: "The educational genesis action creates a live Cell.",
      },
      {
        id: "positive-capacity",
        label: "Capacity is positive",
        description: "The created Cell has capacity greater than 0.",
      },
      {
        id: "lock-exists",
        label: "Lock owner exists",
        description: "The created Cell has an owner-lock script.",
      },
    ],
    hints: [
      "A beginner Cell should start with at least 61 CKBytes.",
      "The lock owner represents who can unlock the Cell later.",
    ],
    nextChallengeId: "execute-state-transition",
  },
  {
    id: "execute-state-transition",
    title: "Execute State Transition",
    concept: "Cell consumption and creation",
    prompt: "Consume one live Cell and create a replacement output Cell.",
    setup: {
      ledger: {
        cells: {
          "cell-alice-hello": {
            id: "cell-alice-hello",
            capacity: 100,
            lock: { kind: "owner-lock", owner: "Alice" },
            type: null,
            data: "Hello",
            status: "live",
          },
        },
      },
      draftTransaction: {
        inputs: ["cell-alice-hello"],
        outputs: [
          {
            capacity: 100,
            lock: { kind: "owner-lock", owner: "Alice" },
            type: null,
            data: "Hello, CKB",
          },
        ],
        witnesses: [{ owner: "Alice" }],
      },
    },
    successCriteria: [
      {
        id: "simulation-succeeds",
        label: "Simulation succeeds",
        description: "The transaction passes simulator validation.",
      },
      {
        id: "input-consumed",
        label: "Input is consumed",
        description: "The original live Cell becomes consumed.",
      },
      {
        id: "output-created",
        label: "Output is created",
        description: "A new live Cell appears after the transaction.",
      },
    ],
    hints: [
      "CKB state changes by replacing Cells, not mutating them in place.",
      "The input owner must provide a witness.",
    ],
    nextChallengeId: "transfer-ownership",
  },
  {
    id: "transfer-ownership",
    title: "Transfer Ownership",
    concept: "Lock scripts",
    prompt: "Transfer a Cell from Alice to Bob by changing the output lock.",
    setup: {
      ledger: {
        cells: {
          "cell-alice-owned": {
            id: "cell-alice-owned",
            capacity: 100,
            lock: { kind: "owner-lock", owner: "Alice" },
            type: null,
            data: "Owned by Alice",
            status: "live",
          },
        },
      },
      draftTransaction: {
        inputs: ["cell-alice-owned"],
        outputs: [
          {
            capacity: 100,
            lock: { kind: "owner-lock", owner: "Bob" },
            type: null,
            data: "Owned by Bob",
          },
        ],
        witnesses: [{ owner: "Alice" }],
      },
    },
    successCriteria: [
      {
        id: "simulation-succeeds",
        label: "Simulation succeeds",
        description: "Alice unlocks the input Cell.",
      },
      {
        id: "owner-changed",
        label: "Owner changes",
        description: "The output Cell is locked by Bob, not Alice.",
      },
    ],
    hints: [
      "The input needs Alice's witness because Alice owns the live Cell.",
      "The output lock decides who owns the new Cell.",
    ],
  },
];

