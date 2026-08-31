import React from "react";
import { Check } from "lucide-react";

export default function AHNAWatchConditions({ conditions }: { conditions: string[] }) {
  if (!conditions || conditions.length === 0) return null;

  return (
    <section className="ahna-watch-conditions">
      <div className="ahna-section-label">WAIT FOR</div>
      <ul className="ahna-condition-list">
        {conditions.map((condition, idx) => (
          <li key={idx}>
            <Check size={14} className="ahna-check-icon" />
            <span>{condition}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
