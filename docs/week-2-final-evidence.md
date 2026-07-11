# Week 2 Final Evidence: CKB Builder Lab

## Milestone

Week 2 focused on simulator engine development.

The Week 2 milestone is complete.

## Implemented

### Next.js Project Setup

The project now has a working Next.js + React + TypeScript scaffold.

Added:

- `package.json`
- `package-lock.json`
- `tsconfig.json`
- `next.config.ts`
- `vitest.config.ts`
- `src/app/layout.tsx`
- `src/app/page.tsx`
- `src/app/globals.css`

The Week 2 page is intentionally minimal. The main deliverable for this week is
the simulator engine, not the full simulator UI.

### Simulator Engine

Implemented a framework-independent TypeScript simulator module in
`src/simulator`.

The simulator now supports:

- educational genesis mode
- normal transaction mode
- live and consumed Cell states
- draft transactions
- output Cell creation
- input Cell consumption
- ledger cloning without mutating failed transactions
- occupied capacity estimation
- validation traces
- structured validation errors

Implemented validation rules:

- transaction mode requires at least one input
- transactions require at least one output
- unknown input Cells fail
- consumed input Cells fail
- output capacity must be greater than 0
- output lock script is required
- output capacity must cover estimated occupied capacity
- output capacity cannot exceed input capacity in transaction mode
- input owners must provide matching witnesses
- educational type script rules must pass

Implemented educational type rules:

- no type rule
- immutable data
- counter increment
- counter decrement

### Challenge Evaluation

Implemented the first challenge evaluator in `src/challenges`.

The evaluator supports the first three MVP challenges:

- Create Your First Cell
- Execute State Transition
- Transfer Ownership

The challenge evaluator checks simulator results and returns:

- pass/fail status
- completed criteria
- failed criteria
- learner-facing feedback messages

### Initial Challenge Content

The existing Week 1 challenge definitions are now executable against the
simulator engine.

The default setup transactions for all three MVP challenges pass their
evaluation tests.

## Verification

The following commands were run successfully:

```bash
npm run typecheck
npm test
npm run build
```

Results:

```text
npm run typecheck
-> passed

npm test
-> 2 test files passed
-> 20 tests passed

npm run build
-> production build completed successfully
-> route / prerendered as static content
```

## Test Coverage

Vitest tests cover:

- educational genesis creates a valid live Cell
- transaction mode consumes one live Cell and creates one output Cell
- consumed Cell reuse fails
- unknown input fails
- missing transaction inputs fail
- missing outputs fail
- zero and negative output capacity fail
- missing output lock fails
- insufficient occupied capacity fails
- output capacity greater than input capacity fails
- missing owner witness fails
- Alice-to-Bob ownership transfer succeeds
- failed transactions do not mutate the original ledger
- immutable data type rule accepts unchanged data
- immutable data type rule rejects changed data
- counter increment accepts `1 -> 2`
- counter increment rejects invalid increments
- the first three challenge definitions evaluate successfully

## Dependency Note

The implementation uses:

- Next.js `16.2.10`
- React `19.2.7`
- TypeScript `5.9.3`
- Vitest `4.1.10`

`npm audit --omit=dev` currently reports a moderate PostCSS advisory through
Next.js. npm suggests `npm audit fix --force`, but that would install
`next@9.3.3`, a breaking downgrade. No forced audit fix was applied.

## Week 2 Status

Completed:

- Next.js project scaffold
- TypeScript simulator engine
- occupied capacity estimation
- transaction validation
- ledger state application
- validation traces
- challenge evaluator
- tests for valid and invalid simulator behavior
- production build verification

The project is ready for Week 3, which can focus on the Cell editor interface,
transaction visualization, and interactive learning flow.

