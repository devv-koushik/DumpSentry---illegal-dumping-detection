import { motion, AnimatePresence } from "framer-motion";
import {
  X, MapPin, Layers, BarChart3, Building2, Send,
  CheckCircle2, XCircle, Eye, ShieldAlert, Radio, Plane, ScanSearch, Lock,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";

export default function IncidentModal({ detection, onClose, onAction }) {
  const { isAdmin, requireAdmin } = useAuth();
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
                {detection.wasteType} · {detection.confidence}%
              </span>
            </div>
          </div>

          {/* Detail Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 px-5 mt-4">
            {[
              { label: "Detection ID", value: detection.id, icon: ScanSearch },
              { label: "Waste Type", value: detection.wasteType, icon: Layers },
              { label: "Confidence", value: `${detection.confidence}%`, icon: BarChart3 },
              { label: "Context", value: detection.context, icon: MapPin },
              { label: "Authority", value: detection.authority, icon: Building2 },
              { label: "Alert Status", value: detection.alertStatus, icon: Radio },
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
            <p className="text-[11px] text-ink">{detection.location}</p>
            <p className="text-[9px] font-mono text-muted mt-0.5">
              {detection.latitude.toFixed(4)}°N, {detection.longitude.toFixed(4)}°E
            </p>
          </div>

          {/* Timeline */}
          <div className="mx-5 mt-4 mb-2">
            <span className="text-[9px] tracking-widest text-muted uppercase font-semibold">Incident Timeline</span>
            <div className="mt-3 space-y-0">
              {timeline.map((step, i) => {
                const StepIcon = step.icon;
                return (
                  <div key={i} className="flex items-start gap-3">
                    <div className="flex flex-col items-center">
                      <div className={`h-5 w-5 rounded-full flex items-center justify-center border ${
                        step.done ? "bg-accent/10 border-accent/30"
                          : step.pending ? "bg-warning/10 border-warning/30 animate-pulse-slow"
                          : "bg-paper2 border-line"
                      }`}>
                        <StepIcon size={10} className={step.done ? "text-accent-deep" : step.pending ? "text-warning" : "text-muted"} />
                      </div>
                      {i < timeline.length - 1 && <div className={`w-px h-5 ${step.done ? "bg-accent/20" : "bg-line"}`} />}
                    </div>
                    <div className="pb-2">
                      <p className="text-[10px] text-ink font-medium">{step.label}</p>
                      <p className="text-[9px] font-mono text-muted">{step.pending ? "Pending" : step.time}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Actions */}
          <div className="sticky bottom-0 flex flex-wrap items-center gap-2 px-5 py-3 bg-white/95 backdrop-blur-xl border-t border-line">
            <button
              onClick={() => {
                if (!requireAdmin("verify dumping detections")) return;
                onAction?.("verify", detection.id);
              }}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-accent/15 border border-accent/20 text-accent-deep text-[10px] font-semibold tracking-wider uppercase hover:bg-accent/25 transition-colors"
            >
              {!isAdmin ? <Lock size={10} className="text-muted" /> : <Eye size={11} />} Verify
            </button>
            <button
              onClick={() => {
                if (!requireAdmin("dispatch alert notifications to authorities")) return;
                onAction?.("alert", detection.id);
              }}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-paper2 border border-line text-ink text-[10px] font-medium tracking-wider uppercase hover:border-accent/30 transition-colors"
            >
              {!isAdmin ? <Lock size={10} className="text-muted" /> : <Send size={11} />} Send Alert
            </button>
            <button
              onClick={() => {
                if (!requireAdmin("reject false detections")) return;
                onAction?.("reject", detection.id);
              }}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-paper2 border border-line text-muted text-[10px] font-medium tracking-wider uppercase hover:border-danger/30 hover:text-danger transition-colors"
            >
              {!isAdmin ? <Lock size={10} className="text-muted" /> : <XCircle size={11} />} Reject
            </button>
            <button
              onClick={() => {
                if (!requireAdmin("change incident lifecycle status to Resolved")) return;
                onAction?.("resolve", detection.id);
              }}
              className="ml-auto flex items-center gap-1.5 px-4 py-2 rounded-lg bg-success/15 border border-success/20 text-success text-[10px] font-semibold tracking-wider uppercase hover:bg-success/25 transition-colors"
            >
              {!isAdmin ? <Lock size={10} className="text-muted" /> : <CheckCircle2 size={11} />} Mark Resolved
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
