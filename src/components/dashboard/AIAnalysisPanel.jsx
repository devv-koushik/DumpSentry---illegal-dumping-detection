import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  ShieldAlert,
  Eye,
  Send,
  CheckCircle2,
  MapPin,
  Clock,
  Layers,
  BarChart3,
  Building2,
  Bell,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";

export default function AIAnalysisPanel({ detection, onClose, onAction }) {
  const { isAdmin } = useAuth();
  if (!detection) return null;

  const riskLevel =
    detection.confidence >= 90
      ? { label: "Critical", color: "text-danger bg-danger/10 border-danger/20" }
      : detection.confidence >= 80
      ? { label: "High", color: "text-warning bg-warning/10 border-warning/20" }
      : detection.confidence >= 70
      ? { label: "Medium", color: "text-muted bg-paper2 border-line" }
      : { label: "Low", color: "text-muted bg-paper2 border-line" };

  return (
    <AnimatePresence>
      <motion.div
        key={detection.id}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 20 }}
        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
        className="absolute top-14 right-3 z-30 w-72 max-h-[calc(100vh-160px)] overflow-y-auto rounded-xl bg-white/95 backdrop-blur-xl border border-line shadow-pop font-cmd"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-line">
          <div className="flex items-center gap-2">
            <ShieldAlert size={12} className="text-accent" />
            <span className="text-[10px] font-semibold tracking-[0.15em] text-accent-deep uppercase">
              AI Analysis
            </span>
          </div>
          <button onClick={onClose} className="p-1 rounded-md hover:bg-paper2 transition-colors">
            <X size={12} className="text-muted" />
          </button>
        </div>

        {/* Detection Image */}
        <div className="relative mx-3 mt-3 overflow-hidden rounded-lg border border-line">
          <img src={detection.image} alt={`Detection ${detection.id}`} className="w-full h-32 object-cover" />
          <div className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-white/80 backdrop-blur text-[9px] font-mono font-medium text-accent-deep">
            {detection.id}
          </div>
          <div className="absolute top-[28%] left-[18%] w-[40%] h-[45%] rounded border-2 border-accent/60">
            <span className="absolute -top-5 left-0 px-1.5 py-0.5 rounded bg-accent/90 text-[8px] font-medium text-white whitespace-nowrap">
              {detection.wasteType} · {detection.confidence}%
            </span>
          </div>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-2 gap-px mx-3 mt-3 rounded-lg overflow-hidden border border-line">
          {[
            { label: "Waste Type", value: detection.wasteType, icon: Layers },
            { label: "Confidence", value: `${detection.confidence}%`, icon: BarChart3 },
            { label: "Context", value: detection.context, icon: MapPin },
            { label: "Risk", value: riskLevel.label, icon: ShieldAlert, customClass: riskLevel.color },
            { label: "Status", value: detection.status, icon: Clock },
            { label: "Authority", value: detection.authority, icon: Building2 },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.label} className="px-2.5 py-2 bg-paper/60">
                <div className="flex items-center gap-1 mb-1">
                  <Icon size={9} className="text-muted" />
                  <span className="text-[8px] tracking-wider text-muted uppercase">{item.label}</span>
                </div>
                <span
                  className={`text-[11px] font-medium leading-tight ${
                    item.customClass
                      ? `inline-block px-1.5 py-0.5 rounded border text-[9px] ${item.customClass}`
                      : "text-ink"
                  }`}
                >
                  {item.value}
                </span>
              </div>
            );
          })}
        </div>

        {/* Alert Status */}
        <div className="mx-3 mt-2 px-2.5 py-2 rounded-lg bg-paper/60 border border-line">
          <div className="flex items-center gap-1 mb-1">
            <Bell size={9} className="text-muted" />
            <span className="text-[8px] tracking-wider text-muted uppercase">Alert Status</span>
          </div>
          <span className={`text-[11px] font-medium ${
            detection.alertStatus === "Sent" ? "text-success"
              : detection.alertStatus === "Failed" ? "text-danger"
              : "text-warning"
          }`}>
            {detection.alertStatus}
          </span>
        </div>

        {/* Location */}
        <div className="mx-3 mt-2 px-2.5 py-2 rounded-lg bg-paper/60 border border-line">
          <div className="flex items-center gap-1 mb-1">
            <MapPin size={9} className="text-muted" />
            <span className="text-[8px] tracking-wider text-muted uppercase">Location</span>
          </div>
          <p className="text-[11px] text-ink">{detection.location}</p>
          <p className="text-[9px] font-mono text-muted mt-0.5">
            {detection.latitude.toFixed(4)}°N, {detection.longitude.toFixed(4)}°E
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-1.5 px-3 py-3">
          <button
            onClick={() => onAction?.("review", detection.id)}
            className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-accent/15 border border-accent/20 text-accent-deep text-[10px] font-semibold tracking-wide uppercase hover:bg-accent/25 transition-colors"
          >
            <Eye size={11} /> Review Detection
          </button>
          {isAdmin && (
            <div className="flex gap-1.5">
              <button
                onClick={() => onAction?.("alert", detection.id)}
                className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 rounded-lg bg-paper2 border border-line text-ink text-[9px] font-medium uppercase tracking-wider hover:border-accent/30 transition-colors"
              >
                <Send size={9} /> Send Alert
              </button>
              <button
                onClick={() => onAction?.("resolve", detection.id)}
                className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 rounded-lg bg-paper2 border border-line text-ink text-[9px] font-medium uppercase tracking-wider hover:border-success/30 transition-colors"
              >
                <CheckCircle2 size={9} /> Resolve
              </button>
            </div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
