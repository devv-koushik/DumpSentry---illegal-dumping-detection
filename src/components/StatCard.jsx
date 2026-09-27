import { motion } from "framer-motion";

export default function StatCard({ label, value, icon: Icon, tone = "ink", delay = 0 }) {
  const toneMap = {
    ink: "text-ink bg-ink/5",
    danger: "text-danger bg-danger/10",
    warning: "text-accent-deep bg-warning/15",
    success: "text-success bg-success/10",
  };
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay, ease: [0.16, 1, 0.3, 1] }}
      className="card flex items-center justify-between p-5"
    >
      <div>
        <p className="text-sm text-muted">{label}</p>
        <p className="mt-1.5 font-mono text-3xl font-semibold text-ink">{value}</p>
      </div>
      {Icon && (
        <div className={`grid h-11 w-11 place-items-center rounded-full ${toneMap[tone]}`}>
          <Icon size={20} />
        </div>
      )}
    </motion.div>
  );
}
