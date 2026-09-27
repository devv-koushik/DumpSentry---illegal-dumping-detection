import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { MapPin, Clock } from "lucide-react";
import DetectionStatus from "./DetectionStatus";
import ConfidenceBadge from "./ConfidenceBadge";

function formatTime(ts) {
  return new Date(ts).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function DetectionCard({ detection, delay = 0, onReview }) {
  const d = detection;
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay, ease: [0.16, 1, 0.3, 1] }}
      className="card overflow-hidden"
    >
      <div className="relative h-40 w-full overflow-hidden bg-surface">
        <img src={d.image} alt={`Drone capture ${d.id}`} className="h-full w-full object-cover" loading="lazy" />
        <span className="absolute left-3 top-3 rounded-pill bg-white/90 px-2.5 py-1 font-mono text-[11px] font-medium text-ink backdrop-blur">
          {d.id}
        </span>
        <div className="absolute right-3 top-3">
          <DetectionStatus status={d.status} />
        </div>
      </div>

      <div className="p-4">
        <div className="flex items-center justify-between">
          <p className="font-medium text-ink">{d.wasteType}</p>
          <ConfidenceBadge value={d.confidence} />
        </div>
        <p className="mt-0.5 text-xs text-muted">{d.context}</p>

        <div className="mt-3 flex flex-col gap-1.5 text-xs text-muted">
          <span className="flex items-center gap-1.5">
            <MapPin size={13} /> {d.location}
          </span>
          <span className="flex items-center gap-1.5">
            <Clock size={13} /> {formatTime(d.timestamp)}
          </span>
        </div>

        <div className="mt-4 flex gap-2">
          <Link to={`/dashboard/detections/${d.id}`} className="btn-outline flex-1 !py-2 text-xs">
            View Details
          </Link>
          <button onClick={() => onReview?.(d)} className="btn-accent flex-1 !py-2 text-xs">
            Review
          </button>
        </div>
      </div>
    </motion.div>
  );
}
