import { motion } from "framer-motion";
import { OVERVIEW_STATS } from "../../data/detections";
import { ScanSearch, AlertTriangle, Clock, CheckCircle2 } from "lucide-react";

const STATS = [
  { label: "Detections", value: OVERVIEW_STATS.total, icon: ScanSearch, color: "text-accent-deep" },
  { label: "Suspected", value: OVERVIEW_STATS.suspectedIllegal, icon: AlertTriangle, color: "text-danger" },
  { label: "Pending", value: OVERVIEW_STATS.pendingReview, icon: Clock, color: "text-warning" },
  { label: "Resolved", value: OVERVIEW_STATS.resolved, icon: CheckCircle2, color: "text-success" },
];

export default function FloatingStats() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.3 }}
      className="absolute top-16 left-4 z-20 flex flex-col gap-2 md:flex-row md:top-[60px] md:left-1/2 md:-translate-x-1/2"
    >
      {STATS.map((s, i) => {
        const Icon = s.icon;
        return (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, delay: 0.4 + i * 0.08 }}
            className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/90 backdrop-blur-lg border border-line shadow-card"
          >
            <Icon size={11} className={s.color} />
            <span className="text-[10px] tracking-wider text-muted uppercase">{s.label}</span>
            <span className="text-xs font-semibold text-ink font-mono">{s.value}</span>
          </motion.div>
        );
      })}
    </motion.div>
  );
}
