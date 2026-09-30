import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ShieldCheck, ExternalLink } from "lucide-react";
import PageHeader from "../components/PageHeader";
import AlertTable from "../components/AlertTable";
import LoadingSpinner from "../components/LoadingSpinner";
import { fetchAlerts, sendAlert } from "../services/mockAlerts";
import { AUTHORITIES } from "../data/authorities";
import { useAuth } from "../context/AuthContext";

export default function Alerts() {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sendingId, setSendingId] = useState(null);
  const [toast, setToast] = useState("");
  const { isAdmin, requireAdmin } = useAuth();

  useEffect(() => {
    fetchAlerts().then((a) => {
      setAlerts(a);
      setLoading(false);
    });
  }, []);

  async function handleSend(alert) {
    if (!requireAdmin("dispatch alert notifications to municipal authorities")) return;
    setSendingId(alert.detectionId);
    try {
      await sendAlert(alert.detectionId);
      setToast(`Alert sent to ${alert.authority}.`);
    } catch {
      setToast(`Failed to notify ${alert.authority}. It can be retried.`);
    }
    const updated = await fetchAlerts();
    setAlerts(updated);
    setSendingId(null);
    setTimeout(() => setToast(""), 3000);
  }

  return (
    <div>
      <PageHeader
        title="Alerts"
        description="Authority notifications generated from AI detections."
        actions={
          <div className="flex items-center gap-3">
            {isAdmin ? (
              <>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-accent/10 px-3 py-1 text-xs font-semibold text-accent-deep">
                  <ShieldCheck size={13} /> Admin Session
                </span>
                <Link
                  to="/dashboard/settings"
                  className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-white px-3 py-1.5 text-xs font-medium text-ink hover:bg-paper transition-colors"
                >
                  <span>Manage Authorities</span>
                  <ExternalLink size={12} className="text-muted" />
                </Link>
              </>
            ) : (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-paper2 px-3 py-1 text-xs font-medium text-muted">
                Public Notifications View
              </span>
            )}
          </div>
        }
      />

      {toast && (
        <div className="mb-6 rounded-card border border-ink/10 bg-white px-4 py-3 text-sm text-ink">{toast}</div>
      )}

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {AUTHORITIES.map((a) => (
          <div key={a.context} className="card p-4">
            <p className="text-xs text-muted">{a.context}</p>
            <p className="mt-1 text-sm font-medium text-ink">{a.authority}</p>
            <p className="mt-0.5 truncate text-xs text-muted">{a.email}</p>
          </div>
        ))}
      </div>

      {loading ? <LoadingSpinner label="Loading alerts…" /> : <AlertTable alerts={alerts} onSend={handleSend} sendingId={sendingId} />}
    </div>
  );
}
