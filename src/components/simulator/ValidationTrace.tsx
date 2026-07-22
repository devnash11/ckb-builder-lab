import { CheckCircle2, CircleAlert, Info, XCircle } from "lucide-react";
import type { ValidationTraceEvent } from "../../simulator";
import { HelpTip } from "./HelpTip";

type ValidationTraceProps = {
  trace: ValidationTraceEvent[];
};

function TraceIcon({ severity }: { severity: ValidationTraceEvent["severity"] }) {
  if (severity === "success") {
    return <CheckCircle2 size={17} aria-hidden="true" />;
  }

  if (severity === "error") {
    return <XCircle size={17} aria-hidden="true" />;
  }

  if (severity === "warning") {
    return <CircleAlert size={17} aria-hidden="true" />;
  }

  return <Info size={17} aria-hidden="true" />;
}

export function ValidationTrace({ trace }: ValidationTraceProps) {
  return (
    <section className="trace-section" aria-labelledby="trace-title">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Validation</p>
          <div className="heading-with-help">
            <h3 id="trace-title">Rule trace</h3>
            <HelpTip label="What is the rule trace?">
              The trace lists each simulator check in order and explains why it
              passed or failed.
            </HelpTip>
          </div>
        </div>
        {trace.length > 0 && <span>{trace.length} checks</span>}
      </div>
      {trace.length === 0 ? (
        <p className="empty-state">
          Run a simulation to see each validation step and explanation.
        </p>
      ) : (
        <ol className="trace-list">
          {trace.map((event) => (
            <li key={event.id} className={`trace-item ${event.severity}`}>
              <span className="trace-icon">
                <TraceIcon severity={event.severity} />
              </span>
              <span>
                <strong>{event.title}</strong>
                <span>{event.detail}</span>
              </span>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
