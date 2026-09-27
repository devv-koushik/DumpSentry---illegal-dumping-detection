import { useState } from "react";
import { motion } from "framer-motion";
import { Filter, X } from "lucide-react";

const STATUS_FILTERS = ["All", "Suspected Illegal", "Pending Review", "Resolved"];
const CONTEXT_FILTERS = ["All", "Roadside", "Hospital", "School", "College", "Public Area", "Residential Area"];
const WASTE_FILTERS = ["All", "Plastic", "Food Waste", "Construction Waste", "Mixed Waste", "Other"];

export default function MapFilters({ filters, onFilterChange }) {
  const [expanded, setExpanded] = useState(false);

  const statusColor = (s) => {
    if (s === "Suspected Illegal") return "border-danger/40 text-danger";
    if (s === "Pending Review") return "border-warning/40 text-warning";
    if (s === "Resolved") return "border-success/40 text-success";
    return "border-line text-muted";
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.5 }}
      className="absolute top-28 md:top-[60px] right-3 z-20 font-cmd"
    >
      <button
        onClick={() => setExpanded((v) => !v)}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border transition-all text-[10px] font-medium tracking-wider uppercase ${
          expanded
            ? "bg-accent/10 border-accent/30 text-accent-deep"
            : "bg-white/90 backdrop-blur-lg border-line text-muted hover:text-ink"
        }`}
      >
        {expanded ? <X size={10} /> : <Filter size={10} />}
        Filters
      </button>

      {expanded && (
        <motion.div
          initial={{ opacity: 0, y: -8, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          className="mt-2 p-3 rounded-xl bg-white/95 backdrop-blur-xl border border-line shadow-pop w-52"
        >
          {/* Status */}
          <div className="mb-3">
            <span className="text-[8px] tracking-widest text-muted uppercase">Status</span>
            <div className="flex flex-wrap gap-1 mt-1.5">
              {STATUS_FILTERS.map((s) => (
                <button
                  key={s}
                  onClick={() => onFilterChange({ ...filters, status: s })}
                  className={`px-2 py-0.5 rounded-full border text-[9px] font-medium transition-all ${
                    filters.status === s
                      ? statusColor(s) + " bg-paper2"
                      : "border-line/50 text-muted/60 hover:text-muted"
                  }`}
                >
                  {s === "All" ? "All" : s.replace("Suspected Illegal", "Suspected")}
                </button>
              ))}
            </div>
          </div>

          {/* Context */}
          <div className="mb-3">
            <span className="text-[8px] tracking-widest text-muted uppercase">Context</span>
            <div className="flex flex-wrap gap-1 mt-1.5">
              {CONTEXT_FILTERS.map((c) => (
                <button
                  key={c}
                  onClick={() => onFilterChange({ ...filters, context: c })}
                  className={`px-2 py-0.5 rounded-full border text-[9px] font-medium transition-all ${
                    filters.context === c
                      ? "border-accent/30 text-accent-deep bg-paper2"
                      : "border-line/50 text-muted/60 hover:text-muted"
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          {/* Waste Type */}
          <div>
            <span className="text-[8px] tracking-widest text-muted uppercase">Waste Type</span>
            <div className="flex flex-wrap gap-1 mt-1.5">
              {WASTE_FILTERS.map((w) => (
                <button
                  key={w}
                  onClick={() => onFilterChange({ ...filters, wasteType: w })}
                  className={`px-2 py-0.5 rounded-full border text-[9px] font-medium transition-all ${
                    filters.wasteType === w
                      ? "border-accent/30 text-accent-deep bg-paper2"
                      : "border-line/50 text-muted/60 hover:text-muted"
                  }`}
                >
                  {w}
                </button>
              ))}
            </div>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
