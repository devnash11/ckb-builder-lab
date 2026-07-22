import {
  ArrowRight,
  BookOpen,
  Check,
  Circle,
  ExternalLink,
  FlaskConical,
  Lightbulb,
} from "lucide-react";
import type {
  ChallengeDefinition,
  ChallengeEvaluation,
} from "../../challenges";

type LearningRailProps = {
  challenges: ChallengeDefinition[];
  activeChallenge: ChallengeDefinition | null;
  completedChallengeIds: string[];
  evaluation: ChallengeEvaluation | null;
  revealedHintCount: number;
  onSelectChallenge: (challengeId: string) => void;
  onOpenSandbox: () => void;
  onRevealHint: () => void;
  onContinue: () => void;
};

export function LearningRail({
  challenges,
  activeChallenge,
  completedChallengeIds,
  evaluation,
  revealedHintCount,
  onSelectChallenge,
  onOpenSandbox,
  onRevealHint,
  onContinue,
}: LearningRailProps) {
  const nextChallenge = activeChallenge?.nextChallengeId;

  return (
    <aside className="learning-rail" aria-labelledby="learning-title">
      <div className="rail-heading">
        <div>
          <p className="eyebrow">Cell model</p>
          <h2 id="learning-title">Learning path</h2>
        </div>
        <span className="progress-count">
          {completedChallengeIds.length}/{challenges.length}
        </span>
      </div>

      <ol className="challenge-nav" aria-label="Cell model challenges">
        {challenges.map((challenge, index) => {
          const completed = completedChallengeIds.includes(challenge.id);
          const active = activeChallenge?.id === challenge.id;

          return (
            <li key={challenge.id}>
              <button
                type="button"
                className={active ? "is-active" : ""}
                onClick={() => onSelectChallenge(challenge.id)}
                aria-current={active ? "step" : undefined}
              >
                <span className={`challenge-step ${completed ? "is-complete" : ""}`}>
                  {completed ? <Check size={14} aria-hidden="true" /> : index + 1}
                </span>
                <span>
                  <strong>{challenge.title}</strong>
                  <small>{challenge.concept}</small>
                </span>
              </button>
            </li>
          );
        })}
      </ol>

      <button
        type="button"
        className={`sandbox-link ${activeChallenge === null ? "is-active" : ""}`}
        onClick={onOpenSandbox}
      >
        <FlaskConical size={16} aria-hidden="true" />
        Sandbox
      </button>

      <div className="lesson-content">
        {activeChallenge ? (
          <>
            <div className="lesson-title">
              <BookOpen size={18} aria-hidden="true" />
              <div>
                <span>{activeChallenge.concept}</span>
                <h3>{activeChallenge.title}</h3>
              </div>
            </div>
            <p className="lesson-prompt">{activeChallenge.prompt}</p>

            <section className="criteria-section" aria-labelledby="criteria-title">
              <h4 id="criteria-title">Success criteria</h4>
              <ul className="criteria-list">
                {activeChallenge.successCriteria.map((criterion) => {
                  const complete = evaluation?.completedCriteria.includes(criterion.id);

                  return (
                    <li key={criterion.id} className={complete ? "is-complete" : ""}>
                      {complete ? (
                        <Check size={15} aria-hidden="true" />
                      ) : (
                        <Circle size={15} aria-hidden="true" />
                      )}
                      <span>{criterion.label}</span>
                    </li>
                  );
                })}
              </ul>
            </section>

            <section className="hint-section" aria-labelledby="hint-title">
              <div className="hint-heading">
                <h4 id="hint-title">Hints</h4>
                {revealedHintCount < activeChallenge.hints.length && (
                  <button type="button" onClick={onRevealHint}>
                    <Lightbulb size={14} aria-hidden="true" />
                    Reveal
                  </button>
                )}
              </div>
              {revealedHintCount === 0 ? (
                <p>Hints stay hidden until you need one.</p>
              ) : (
                <ol>
                  {activeChallenge.hints.slice(0, revealedHintCount).map((hint) => (
                    <li key={hint}>{hint}</li>
                  ))}
                </ol>
              )}
            </section>

            {evaluation && (
              <div
                className={`challenge-feedback ${evaluation.passed ? "success" : "error"}`}
                role="status"
              >
                <strong>{evaluation.passed ? "Challenge passed" : "Keep building"}</strong>
                <span>{evaluation.messages[0]?.text}</span>
                {evaluation.passed && nextChallenge && (
                  <button type="button" onClick={onContinue}>
                    Next challenge
                    <ArrowRight size={15} aria-hidden="true" />
                  </button>
                )}
              </div>
            )}
          </>
        ) : (
          <div className="sandbox-copy">
            <FlaskConical size={20} aria-hidden="true" />
            <h3>Open sandbox</h3>
            <p>
              Build freely with every simulator control. Results still use the same
              deterministic Cell validation engine.
            </p>
          </div>
        )}
      </div>

      <a
        className="docs-link"
        href="https://docs.nervos.org/docs/tech-explanation/cell"
        target="_blank"
        rel="noreferrer"
      >
        CKB Cell Model docs
        <ExternalLink size={14} aria-hidden="true" />
      </a>
    </aside>
  );
}
