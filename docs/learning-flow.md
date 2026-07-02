# Learning Flow

## Audience

The first learning path is for developers who know at least one blockchain
model but are new to CKB.

Assumed background:

- understands transactions at a high level
- may know account-based chains such as Ethereum
- may know account-data/program models such as Solana
- does not yet understand Cells as CKB's state model

## Learning Promise

After the first path, the learner should be able to explain and demonstrate:

- what a Cell contains
- how ownership is represented by lock scripts
- how state changes by consuming and creating Cells
- why type scripts can constrain state transitions
- why capacity is both value and storage bound

## Path Structure

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

## Screen Model

The MVP can use one primary app screen with three panes:

- left: lesson and challenge prompt
- center: Cell and transaction editor
- right: validation trace and before/after state

This avoids sending beginners across multiple pages while they are trying to
connect concepts.

## Interaction Principles

- Every concept should have a visible object in the simulator.
- Every failure should explain the violated rule.
- Every challenge should be completable in under five minutes.
- Users should be able to reset a challenge without losing other progress.
- The simulator should show consumed Cells rather than hiding them immediately,
  because consumed history teaches the Cell lifecycle.

## Lesson Copy Direction

Keep text short and connected to the UI.

Example:

> A CKB transaction does not mutate a Cell in place. It consumes live input
> Cells and creates new output Cells.

Then immediately show:

```text
Input Cell: live -> consumed
Output Cell: created -> live
```

## Completion Metrics

During user testing, record:

- how many users complete each challenge
- where users fail validation most often
- whether users can explain Cell consumption after Challenge 2
- whether users can explain ownership transfer after Challenge 3
- time to complete first three challenges

Manual testing notes are acceptable for Spark MVP. Product analytics are not
required unless the team adds persistence.

