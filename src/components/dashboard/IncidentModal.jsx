import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  MapPin,
  Layers,
  BarChart3,
  Building2,
  Send,
  CheckCircle2,
  XCircle,
  Eye,
  ShieldAlert,
  Radio,
  Plane,
  ScanSearch,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";

export default function IncidentModal({ detection, onClose, onAction }) {
  const { isAdmin } = useAuth();
  if (!detection) return null;

  const timestamp = new Date(detection.timestamp);
  const timeStr = timestamp.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
  const dateStr = timestamp.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

  const timeline = [
    { time: timeStr, label: "Drone captured image", icon: Plane, done: true },
    { time: `${timestamp.getHours()}:${String(timestamp.getMinutes() + 1).padStart(2, "0")}`, label: "AI detection completed", icon: ScanSearch, done: true },
    { time: `${timestamp.getHours()}:${String(timestamp.getMinutes() + 2).padStart(2, "0")}`, label: "Context classified", icon: Layers, done: true },
    { time: `${timestamp.getHours()}:${String(timestamp.getMinutes() + 3).padStart(2, "0")}`, label: "Authority identified", icon: Building2, done: true },
    { time: "—", label: "Human verification", icon: Eye, done: detection.status === "Resolved", pending: detection.status !== "Resolved" },
  ];

  const conf = Number(detection.confidence) || 0;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-ink/30 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white border border-line shadow-pop font-cmd"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-3 bg-white/95 backdrop-blur-xl border-b border-line">
            <div className="flex items-center gap-3">
              <ShieldAlert size={14} className="text-accent" />
              <div>
                <h2 className="text-sm font-semibold text-ink">Incident {detection.id}</h2>
                <p className="text-[10px] text-muted">{dateStr} · {timeStr}</p>
              </div>
            </div>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-paper2 transition-colors">
              <X size={16} className="text-muted" />
            </button>
          </div>

          {/* Image */}
          <div className="relative mx-5 mt-4 rounded-xl overflow-hidden border border-line">
            <img src={detection.image} alt={`Detection ${detection.id}`} className="w-full h-56 object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-white/40 to-transparent" />
            <div className="absolute top-[25%] left-[15%] w-[45%] h-[50%] rounded border-2 border-accent/70">
              <span className="absolute -top-6 left-0 px-2 py-0.5 rounded bg-accent/90 text-[9px] font-semibold text-white whitespace-nowrap">
                {detection.wasteType || "Waste"} · {conf}%
              </span>
            </div>
          </div>

          {/* Detail Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 px-5 mt-4">
            {[
              { label: "Detection ID", value: detection.id, icon: ScanSearch },
              { label: "Waste Type", value: detection.wasteType || "General Waste", icon: Layers },
              { label: "Confidence", value: `${conf}%`, icon: BarChart3 },
              { label: "Context", value: detection.context || "Unclassified", icon: MapPin },
              { label: "Authority", value: detection.authority || "Pending Assignment", icon: Building2 },
              { label: "Alert Status", value: detection.alertStatus || "Not Sent", icon: Radio },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.label} className="px-3 py-2.5 rounded-lg bg-paper/60 border border-line">
                  <div className="flex items-center gap-1 mb-1">
                    <Icon size={10} className="text-muted" />
                    <span className="text-[8px] tracking-widest text-muted uppercase">{item.label}</span>
                  </div>
                  <span className="text-[11px] font-medium text-ink">{item.value}</span>
                </div>
              );
            })}
          </div>

          {/* Location */}
          <div className="mx-5 mt-3 px-3 py-2.5 rounded-lg bg-paper/60 border border-line">
            <div className="flex items-center gap-1 mb-1">
              <MapPin size={10} className="text-muted" />
              <span className="text-[8px] tracking-widest text-muted uppercase">Location</span>
            </div>
            <p className="text-[11px] text-ink">{detection.location || "Location Unavailable"}</p>
            <p className="text-[9px] font-mono text-muted mt-0.5">
              {detection.latitude != null && detection.longitude != null && !isNaN(Number(detection.latitude))
                ? `${Number(detection.latitude).toFixed(4)}°N, ${Number(detection.longitude).toFixed(4)}°E`
                : "GPS Telemetry Unavailable"}
            </p>
          </div>

          {/* Timeline */}
          <div className="mx-5 mt-3 p-4 rounded-xl bg-paper/40 border border-line">
            <span className="text-[9px] font-semibold tracking-widest text-muted uppercase">
              Incident Pipeline
            </span>
            <div className="flex items-center justify-between mt-3 relative">
              <div className="absolute top-3 left-4 right-4 h-0.5 bg-line z-0" />
              {timeline.map((step) => {
                const Icon = step.icon;
                return (
                  <div key={step.label} className="relative z-10 flex flex-col items-center text-center">
                    <div
                      className={`h-6 w-6 rounded-full flex items-center justify-center transition-colors ${
                        step.done
                          ? "bg-accent text-white"
                          : step.pending
                          ? "bg-paper2 text-accent border border-accent/40"
                          : "bg-paper2 text-muted border border-line"
                      }`}
                    >
                      <Icon size={11} />
                    </div>
                    <span className="text-[8px] font-mono text-muted mt-1">{step.time}</span>
                    <span className="text-[9px] font-medium text-ink mt-0.5 max-w-[80px] leading-tight">
                      {step.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between px-6 py-4 mt-2 bg-paper/30 border-t border-line">
            <div className="flex items-center gap-2">
              <span
                className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-semibold ${
                  detection.status === "Suspected Illegal"
                    ? "text-danger bg-danger/10 border border-danger/20"
                    : detection.status === "Resolved"
                    ? "text-success bg-success/10 border border-success/20"
                    : "text-warning bg-warning/10 border border-warning/20"
                }`}
              >
                {detection.status}
              </span>
            </div>

            {isAdmin && (
              <div className="flex items-center gap-2">
                {detection.status !== "Resolved" && (
                  <button
                    onClick={() => onAction("resolve", detection.id)}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-success text-white text-[11px] font-semibold hover:bg-success/90 transition-all shadow-sm"
                  >
                    <CheckCircle2 size={13} />
                    Mark Resolved
                  </button>
                )}
                {detection.status === "Pending Review" && (
                  <>
                    <button
                      onClick={() => onAction("verify", detection.id)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-accent text-white text-[11px] font-semibold hover:bg-accent-deep transition-all shadow-sm"
                    >
                      <ShieldAlert size={13} />
                      Confirm Illegal
                    </button>
                    <button
                      onClick={() => onAction("reject", detection.id)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-line bg-white text-muted hover:text-ink text-[11px] font-semibold transition-all"
                    >
                      <XCircle size={13} />
                      Dismiss
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
