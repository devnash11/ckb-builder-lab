"use client";

import {
  ArrowLeft,
  ArrowRight,
  GraduationCap,
  X,
} from "lucide-react";
import type { CSSProperties } from "react";
import { useEffect, useRef, useState } from "react";

type TourView = "mission" | "build" | "result";

type TourStep = {
  title: string;
  description: string;
  selector: string | null;
  view: TourView;
  placement: "top" | "right" | "bottom" | "left";
};

type HighlightRect = {
  top: number;
  right: number;
  bottom: number;
  left: number;
  width: number;
  height: number;
};

type GuidedTourProps = {
  restartToken: number;
  onMobileViewChange: (view: TourView) => void;
};

const TOUR_SESSION_KEY = "ckb-builder-lab-tour-seen";

const tourSteps: TourStep[] = [
  {
    title: "Meet the Cell Model",
    description:
      "This lab lets you learn CKB by doing. You will create Cells, spend them in transactions, and see every rule the simulator checks.",
    selector: null,
    view: "mission",
    placement: "bottom",
  },
  {
    title: "Follow one small mission",
    description:
      "Start with the task and success criteria. Each mission teaches one idea, and hints stay available when you get stuck.",
    selector: ".learning-rail",
    view: "mission",
    placement: "right",
  },
  {
    title: "Build with Cells",
    description:
      "Choose a live input, provide its witness, and describe the replacement output Cell.",
    selector: ".build-workspace",
    view: "build",
    placement: "right",
  },
  {
    title: "Watch the Cell Journey",
    description:
      "Predict the result, then replay how a live input passes each rule, becomes consumed, and produces a new live output Cell.",
    selector: ".journey-section",
    view: "result",
    placement: "left",
  },
  {
    title: "Simulate, then apply",
    description:
      "Simulate previews the result. Apply commits a valid result to the local ledger. Reset always restores the current mission.",
    selector: ".command-dock",
    view: "build",
    placement: "top",
  },
];

function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(Math.max(value, minimum), maximum);
}

function cardPosition(
  rect: HighlightRect | null,
  placement: TourStep["placement"],
): CSSProperties {
  if (!rect) {
    return {};
  }

  if (window.innerWidth <= 860) {
    return {
      right: 12,
      bottom: 82,
      left: 12,
    };
  }

  const width = 330;
  const estimatedHeight = 230;
  const gap = 14;
  const maximumLeft = window.innerWidth - width - 16;
  const maximumTop = window.innerHeight - estimatedHeight - 16;
  let left = clamp(rect.left, 16, maximumLeft);
  let top = clamp(rect.bottom + gap, 16, maximumTop);

  if (placement === "right") {
    left = rect.right + gap;
    top = rect.top + Math.min(28, rect.height / 4);
  } else if (placement === "left") {
    left = rect.left - width - gap;
    top = rect.top + Math.min(28, rect.height / 4);
  } else if (placement === "top") {
    left = rect.left + rect.width / 2 - width / 2;
    top = rect.top - estimatedHeight - gap;
  } else {
    left = rect.left + rect.width / 2 - width / 2;
    top = rect.bottom + gap;
  }

  return {
    top: clamp(top, 16, maximumTop),
    left: clamp(left, 16, maximumLeft),
    width,
  };
}

export function GuidedTour({
  restartToken,
  onMobileViewChange,
}: GuidedTourProps) {
  const [open, setOpen] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [highlightRect, setHighlightRect] = useState<HighlightRect | null>(null);
  const cardRef = useRef<HTMLElement>(null);
  const step = tourSteps[stepIndex];

  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (window.sessionStorage.getItem(TOUR_SESSION_KEY) !== "true") {
        setStepIndex(0);
        setOpen(true);
      }
    }, 450);

    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (restartToken === 0) {
      return;
    }

    setStepIndex(0);
    setOpen(true);
  }, [restartToken]);

  useEffect(() => {
    if (!open) {
      return;
    }

    onMobileViewChange(step.view);
    const updateHighlight = () => {
      const target = step.selector
        ? document.querySelector<HTMLElement>(step.selector)
        : null;

      if (!target) {
        setHighlightRect(null);
        return;
      }

      const rect = target.getBoundingClientRect();
      setHighlightRect({
        top: Math.max(rect.top - 5, 6),
        right: Math.min(rect.right + 5, window.innerWidth - 6),
        bottom: Math.min(rect.bottom + 5, window.innerHeight - 6),
        left: Math.max(rect.left - 5, 6),
        width: Math.min(rect.width + 10, window.innerWidth - 12),
        height: Math.min(rect.height + 10, window.innerHeight - 12),
      });
    };

    const frame = window.requestAnimationFrame(updateHighlight);
    const settledUpdate = window.setTimeout(updateHighlight, 180);
    window.addEventListener("resize", updateHighlight);
    window.addEventListener("scroll", updateHighlight, true);

    return () => {
      window.cancelAnimationFrame(frame);
      window.clearTimeout(settledUpdate);
      window.removeEventListener("resize", updateHighlight);
      window.removeEventListener("scroll", updateHighlight, true);
    };
  }, [onMobileViewChange, open, step]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    cardRef.current?.focus();
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        finishTour();
      } else if (event.key === "ArrowRight") {
        setStepIndex((current) => Math.min(current + 1, tourSteps.length - 1));
      } else if (event.key === "ArrowLeft") {
        setStepIndex((current) => Math.max(current - 1, 0));
      } else if (event.key === "Tab") {
        const focusableElements = cardRef.current?.querySelectorAll<HTMLElement>(
          "button:not(:disabled)",
        );
        const firstElement = focusableElements?.[0];
        const lastElement = focusableElements?.[focusableElements.length - 1];

        if (event.shiftKey && document.activeElement === firstElement) {
          event.preventDefault();
          lastElement?.focus();
        } else if (!event.shiftKey && document.activeElement === lastElement) {
          event.preventDefault();
          firstElement?.focus();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, stepIndex]);

  function finishTour() {
    window.sessionStorage.setItem(TOUR_SESSION_KEY, "true");
    setOpen(false);
    setHighlightRect(null);
  }

  if (!open) {
    return null;
  }

  const finalStep = stepIndex === tourSteps.length - 1;

  return (
    <div className={`tour-layer ${highlightRect ? "" : "is-centered"}`}>
      {highlightRect && (
        <div
          className="tour-spotlight"
          style={{
            top: highlightRect.top,
            left: highlightRect.left,
            width: highlightRect.width,
            height: highlightRect.height,
          }}
          aria-hidden="true"
        />
      )}
      <section
        ref={cardRef}
        className={`tour-card ${highlightRect ? "" : "is-centered"}`}
        style={cardPosition(highlightRect, step.placement)}
        role="dialog"
        aria-modal="true"
        aria-labelledby="tour-title"
        tabIndex={-1}
      >
        <header>
          <span className="tour-guide-mark" aria-hidden="true">
            <GraduationCap size={18} />
          </span>
          <span>
            <strong>Cell Guide</strong>
            <small>Personal tutor</small>
          </span>
          <button type="button" onClick={finishTour} aria-label="Close Cell Guide">
            <X size={17} aria-hidden="true" />
          </button>
        </header>

        <p className="tour-step-count">
          Step {stepIndex + 1} of {tourSteps.length}
        </p>
        <h2 id="tour-title">{step.title}</h2>
        <p className="tour-description">{step.description}</p>

        <div className="tour-progress" aria-hidden="true">
          {tourSteps.map((tourStep, index) => (
            <i key={tourStep.title} className={index <= stepIndex ? "is-active" : ""} />
          ))}
        </div>

        <footer>
          <button type="button" className="tour-skip" onClick={finishTour}>
            Skip tour
          </button>
          <span>
            <button
              type="button"
              className="tour-back"
              disabled={stepIndex === 0}
              onClick={() => setStepIndex((current) => current - 1)}
              aria-label="Previous tour step"
            >
              <ArrowLeft size={16} aria-hidden="true" />
            </button>
            <button
              type="button"
              className="tour-next"
              onClick={() =>
                finalStep ? finishTour() : setStepIndex((current) => current + 1)
              }
            >
              {finalStep ? "Start building" : "Next"}
              {!finalStep && <ArrowRight size={16} aria-hidden="true" />}
            </button>
          </span>
        </footer>
      </section>
    </div>
  );
}
