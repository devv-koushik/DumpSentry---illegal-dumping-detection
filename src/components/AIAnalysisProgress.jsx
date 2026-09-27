import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { ANALYSIS_STAGES } from "../services/mockAI";

export default function AIAnalysisProgress({ activeIndex }) {
  return (
    <div className="card p-6">
      <p className="eyebrow mb-5">AI Pipeline</p>
      <ol className="space-y-4">
        {ANALYSIS_STAGES.map((stage, i) => {
          const done = i < activeIndex;
          const active = i === activeIndex;
          return (
            <li key={stage} className="flex items-center gap-3">
              <span
                className={`grid h-7 w-7 flex-shrink-0 place-items-center rounded-full border text-xs font-medium transition-colors ${
                  done
                    ? "border-success bg-success text-white"
                    : active
                    ? "border-accent bg-accent/10 text-accent-deep"
                    : "border-ink/15 text-muted"
                }`}
              >
                {done ? <Check size={13} /> : i + 1}
              </span>
              <span className={`text-sm ${done || active ? "text-ink font-medium" : "text-muted"}`}>{stage}</span>
              {active && (
                <motion.span
                  className="ml-auto h-1.5 w-1.5 rounded-full bg-accent"
                  animate={{ opacity: [1, 0.2, 1] }}
                  transition={{ repeat: Infinity, duration: 1.1 }}
                />
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
