import { Link } from "react-router-dom";
import DetectionStatus from "./DetectionStatus";
import ConfidenceBadge from "./ConfidenceBadge";
import EmptyState from "./EmptyState";

function formatDate(ts) {
  return new Date(ts).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

export default function DetectionTable({ detections }) {
  if (!detections?.length) {
    return <EmptyState title="No detections match your filters" description="Try widening your search or clearing filters." />;
  }

  return (
    <div className="card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[820px] text-left text-sm">
          <thead>
            <tr className="border-b border-line text-xs uppercase tracking-wide text-muted">
              <th className="px-5 py-3 font-medium">ID</th>
              <th className="px-5 py-3 font-medium">Date</th>
              <th className="px-5 py-3 font-medium">Location</th>
              <th className="px-5 py-3 font-medium">Waste Type</th>
              <th className="px-5 py-3 font-medium">Context</th>
              <th className="px-5 py-3 font-medium">Confidence</th>
              <th className="px-5 py-3 font-medium">Authority</th>
              <th className="px-5 py-3 font-medium">Status</th>
              <th className="px-5 py-3 font-medium" />
            </tr>
          </thead>
          <tbody>
            {detections.map((d) => (
              <tr key={d.id} className="border-b border-line/70 last:border-0 hover:bg-ink/[.02]">
                <td className="px-5 py-3 font-mono text-xs text-ink">{d.id}</td>
                <td className="px-5 py-3 text-muted">{formatDate(d.timestamp)}</td>
                <td className="px-5 py-3 text-ink">{d.location}</td>
                <td className="px-5 py-3 text-ink">{d.wasteType}</td>
                <td className="px-5 py-3 text-muted">{d.context}</td>
                <td className="px-5 py-3"><ConfidenceBadge value={d.confidence} /></td>
                <td className="px-5 py-3 text-muted">{d.authority}</td>
                <td className="px-5 py-3"><DetectionStatus status={d.status} /></td>
                <td className="px-5 py-3 text-right">
                  <Link to={`/dashboard/detections/${d.id}`} className="text-xs font-medium text-accent-deep hover:underline">
                    View →
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
