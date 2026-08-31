import React from "react";
import type { AHNAInstruction as AHNAInstructionType } from "@/lib/ahna-types";

export default function AHNAInstruction({ instruction }: { instruction: AHNAInstructionType }) {
  return (
    <section className="ahna-instruction-block">
      <div className="ahna-section-label">AI INSTRUCTION</div>
      <h3 className="ahna-instruction-title">{instruction.title}</h3>
      <p className="ahna-instruction-msg">{instruction.message}</p>
    </section>
  );
}
