"use client";

import { CircleHelp } from "lucide-react";
import { useId, useState } from "react";

type HelpTipProps = {
  label: string;
  children: string;
};

export function HelpTip({ label, children }: HelpTipProps) {
  const tooltipId = useId();
  const [open, setOpen] = useState(false);

  return (
    <span className={`help-tip ${open ? "is-open" : ""}`}>
      <button
        type="button"
        aria-label={label}
        aria-describedby={open ? tooltipId : undefined}
        aria-expanded={open}
        onClick={(event) => {
          event.preventDefault();
          setOpen((current) => !current);
        }}
        onBlur={() => setOpen(false)}
      >
        <CircleHelp size={14} aria-hidden="true" />
      </button>
      <span id={tooltipId} className="help-tip-bubble" role="tooltip">
        {children}
      </span>
    </span>
  );
}
