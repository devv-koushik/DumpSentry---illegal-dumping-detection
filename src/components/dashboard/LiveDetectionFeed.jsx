import { motion } from "framer-motion";
import { Activity } from "lucide-react";

export default function LiveDetectionFeed({ detections, selectedId, onSelect }) {
  const recent = detections.slice(0, 8);

  const statusDot = (status) => {
    if (status === "Suspected Illegal") return "bg-danger";
    if (status === "Pending Review") return "bg-warning";
    return "bg-success";
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -16 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5, delay: 0.4 }}
      className="absolute bottom-20 left-3 z-20 w-56 rounded-xl bg-white/90 backdrop-blur-xl border border-line shadow-pop font-cmd overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-line">
        <Activity size={10} className="text-accent animate-pulse-slow" />
        <span className="text-[9px] font-semibold tracking-[0.15em] text-accent-deep uppercase">
          Live Detections
        </span>
      </div>

      {/* Feed */}
      <div className="max-h-52 overflow-y-auto custom-scrollbar-light">
        {recent.map((d, i) => (
          <motion.button
            key={d.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 + i * 0.05 }}
            onClick={() => onSelect(d)}
            className={`w-full flex items-start gap-2.5 px-3 py-2 text-left transition-colors border-b border-line/50 last:border-0 ${
              selectedId === d.id
                ? "bg-accent/8"
                : "hover:bg-paper2/60"
            }`}
          >
            <span className={`mt-1.5 h-1.5 w-1.5 rounded-full flex-shrink-0 ${statusDot(d.status)}`} />
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-mono font-medium text-ink">{d.id}</span>
                <span className="text-[9px] font-mono text-accent-deep">{d.confidence}%</span>
              </div>
              <p className="text-[9px] text-muted truncate">{d.wasteType}</p>
              <p className="text-[8px] text-muted/70 truncate">{d.context} · {d.location.split(",")[0]}</p>
            </div>
          </motion.button>
        ))}
      </div>
    </motion.div>
  );
}
