# Week 3 Final Evidence: CKB Builder Lab

## Milestone

Week 3 focused on frontend implementation.

The Week 3 milestone is complete.

## Implemented

### Interactive Simulator UI

The app now opens directly into a browser-based simulator workspace instead of
the Week 2 status page.

The interface uses a three-pane developer tool layout:

- Cell ledger
- transaction builder
- transaction result and validation trace

### Cell Ledger

The Cell ledger shows all current simulator Cells and their status.

It displays:

- Cell ID
- capacity in CKBytes
- lock owner
- type script rule
- data
- live or consumed status

Live Cells can be selected as transaction inputs. Consumed Cells remain visible
for learning purposes, but cannot be selected again.

### Transaction Builder

The transaction builder lets users create and simulate draft transactions from
the browser.

Implemented controls:

- transaction mode
- educational genesis mode
- owner witness selection
- output Cell capacity
- output lock owner
- optional output lock
- output type script rule
- output data
- include or remove output Cell
- simulate
- apply valid result
- clear draft
- reset simulator

### Transaction Visualization

The result pane shows the transaction flow:

```text
Inputs -> Validation -> Outputs
```

It also shows:

- valid or failed result state
- before and after Cell counts
- validation trace events
- human-readable validation explanations

Successful simulation results can be applied to the current ledger. Failed
simulation results do not mutate the ledger.

### Simulator Engine Integration

The UI uses the Week 2 simulator engine as the validation source of truth.

The frontend does not duplicate transaction validation logic. It builds a draft
transaction, sends it to `simulateTransaction`, and renders the returned
`SimulationResult`.

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

The local app was also started with:

```bash
npm run dev -- --hostname 127.0.0.1 --port 3001
```

The page returned HTTP 200 and rendered the Week 3 simulator headings.

## Manual Browser Scenarios

The Week 3 UI should be verified with these scenarios:

1. Open the app and confirm the starter ledger shows one live Alice Cell.
2. Select the live Alice Cell and run a transaction simulation.
3. Confirm the validation trace shows a successful transaction.
4. Apply the successful result.
5. Confirm the original Cell becomes consumed and a new live Cell appears.
6. Confirm the consumed Cell cannot be selected again.
7. Remove Alice from the witness list and simulate a transaction using an
   Alice-owned input.
8. Confirm the validation trace shows a missing witness error.
9. Set output capacity below the estimated occupied capacity and simulate.
10. Confirm the validation trace shows an insufficient capacity error.
11. Set output owner to Bob and simulate with Alice as witness.
12. Confirm the transaction demonstrates ownership transfer from Alice to Bob.
13. Reset the simulator and confirm the starter state returns.

## Week 3 Status

Completed:

- interactive Cell ledger
- editable transaction builder
- output Cell editor
- witness controls
- educational genesis mode control
- transaction mode control
- transaction flow visualization
- validation trace rendering
- apply successful result flow
- failed simulation feedback flow
- reset and clear draft controls
- responsive dashboard styling

The project is ready for Week 4, which can focus on the challenge system UI,
challenge progression, automatic challenge completion feedback, and learning
path integration.

## Dependency Note

The implementation uses:

- Next.js `16.2.11`
- React `19.2.7`
- TypeScript `5.9.3`
- Vitest `4.1.10`
- lucide-react `1.25.0`

`npm audit --omit=dev` currently reports upstream advisories through Next.js
dependencies, including PostCSS and Sharp. npm suggests `npm audit fix --force`,
but that would install `next@9.3.3`, a breaking downgrade. No forced audit fix
was applied.
