import EmptyState from "./EmptyState";
import { useAuth } from "../context/AuthContext";

const STATUS_STYLE = {
  Sent: "bg-success/10 text-success",
  Pending: "bg-warning/15 text-accent-deep",
  Failed: "bg-danger/10 text-danger",
  Resolved: "bg-ink/8 text-muted",
};

function formatDate(ts) {
  return new Date(ts).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

export default function AlertTable({ alerts, onSend, sendingId }) {
  const { isAdmin } = useAuth();

  if (!alerts?.length) {
    return <EmptyState title="No alerts yet" description="Alerts will appear here once detections are routed to an authority." />;
  }

  return (
    <div className="card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[860px] text-left text-sm">
          <thead>
            <tr className="border-b border-line text-xs uppercase tracking-wide text-muted">
              <th className="px-5 py-3 font-medium">Incident</th>
              <th className="px-5 py-3 font-medium">Location</th>
              <th className="px-5 py-3 font-medium">Context</th>
              <th className="px-5 py-3 font-medium">Authority</th>
              <th className="px-5 py-3 font-medium">Email</th>
              <th className="px-5 py-3 font-medium">Status</th>
              <th className="px-5 py-3 font-medium">Date</th>
              {isAdmin && <th className="px-5 py-3 font-medium text-right">Actions</th>}
            </tr>
          </thead>
          <tbody>
            {alerts.map((a) => (
              <tr key={a.id} className="border-b border-line/70 last:border-0 hover:bg-ink/[.02]">
                <td className="px-5 py-3">
                  <p className="text-ink">{a.incident}</p>
                  <p className="font-mono text-[11px] text-muted">{a.detectionId}</p>
                </td>
                <td className="px-5 py-3 text-muted">{a.location}</td>
                <td className="px-5 py-3 text-muted">{a.context}</td>
                <td className="px-5 py-3 text-ink">{a.authority}</td>
                <td className="px-5 py-3 text-muted">{a.email}</td>
                <td className="px-5 py-3">
                  <span className={`inline-flex items-center rounded-pill px-3 py-1 text-xs font-semibold ${STATUS_STYLE[a.status]}`}>
                    {a.status}
                  </span>
                </td>
                <td className="px-5 py-3 text-muted">{formatDate(a.date)}</td>
                {isAdmin && (
                  <td className="px-5 py-3 text-right">
                    {a.status === "Pending" || a.status === "Failed" ? (
                      <button
                        onClick={() => onSend?.(a)}
                        disabled={sendingId === a.detectionId}
                        className="inline-flex items-center gap-1 text-xs font-medium text-accent-deep hover:underline disabled:opacity-50"
                        title="Dispatch alert"
                      >
                        {sendingId === a.detectionId ? "Sending…" : "Send Alert"}
                      </button>
                    ) : (
                      <span className="text-xs text-muted">—</span>
                    )}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
