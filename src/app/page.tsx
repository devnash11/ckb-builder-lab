import { initialChallenges } from "../content/initial-challenges";

export default function Home() {
  return (
    <main>
      <div className="shell">
        <p className="eyebrow">Week 2 Engine Build</p>
        <h1>CKB Builder Lab</h1>
        <p className="summary">
          The current milestone implements the simulator engine and challenge
          verification layer that will power the interactive Cell Model
          onboarding experience.
        </p>

        <section className="status" aria-label="Week 2 implementation status">
          <div className="status-card">
            <strong>Simulator Engine</strong>
            <p>Framework-independent TypeScript module with validation traces.</p>
          </div>
          <div className="status-card">
            <strong>Challenge Engine</strong>
            <p>{initialChallenges.length} initial Cell Model challenges defined.</p>
          </div>
          <div className="status-card">
            <strong>Testing</strong>
            <p>Vitest validates successful and failed transaction scenarios.</p>
          </div>
        </section>
      </div>
    </main>
  );
}
