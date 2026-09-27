import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, MapPin, Clock, Navigation, CheckCircle2, Send, ShieldCheck } from "lucide-react";
import PageHeader from "../components/PageHeader";
import DetectionStatus from "../components/DetectionStatus";
import ConfidenceBadge from "../components/ConfidenceBadge";
import LoadingSpinner from "../components/LoadingSpinner";
import { fetchDetectionById, updateDetectionStatus, updateAlertStatus } from "../services/mockDetections";
import { sendAlert } from "../services/mockAlerts";

export default function DetectionDetails() {
  const { id } = useParams();
  const [detection, setDetection] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState("");

  useEffect(() => {
    setLoading(true);
    fetchDetectionById(id).then((d) => {
      setDetection(d);
      setLoading(false);
    });
  }, [id]);

  function notify(msg) {
    setToast(msg);
    setTimeout(() => setToast(""), 2800);
  }

  async function handleVerify() {
    setBusy(true);
    const updated = await updateDetectionStatus(id, "Suspected Illegal");
    setDetection(updated);
    setBusy(false);
    notify("Detection verified as Suspected Illegal Dumping.");
  }

  async function handleSendAlert() {
    setBusy(true);
    try {
      await sendAlert(id);
      const updated = await updateAlertStatus(id, "Sent");
      setDetection(updated);
      notify(`Alert dispatched to ${detection.authority}.`);
    } catch {
      const updated = await updateAlertStatus(id, "Failed");
      setDetection(updated);
      notify("Alert dispatch failed. You can retry from the Alerts page.");
    }
    setBusy(false);
  }

  async function handleResolve() {
    setBusy(true);
    const updated = await updateDetectionStatus(id, "Resolved");
    setDetection(updated);
    setBusy(false);
    notify("Marked as Resolved.");
  }

  if (loading) return <LoadingSpinner label="Loading detection…" />;
  if (!detection) return null;
  const d = detection;

  return (
    <div>
      <Link to="/dashboard/detections" className="mb-5 inline-flex items-center gap-1.5 text-sm text-muted hover:text-ink">
        <ArrowLeft size={15} /> Back to Detections
      </Link>

      <PageHeader
        title={`Detection ${d.id}`}
        description="AI outputs require human verification before any enforcement action."
        actions={<DetectionStatus status={d.status} />}
      />

      {toast && (
        <div className="mb-6 rounded-card border border-success/25 bg-success/10 px-4 py-3 text-sm text-success">
          {toast}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">Original Image</p>
              <img src={d.image} alt={`Original capture ${d.id}`} className="h-64 w-full rounded-card object-cover" />
            </div>
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">AI Annotated</p>
              <div className="relative h-64 w-full overflow-hidden rounded-card">
                <img src={d.image} alt={`Annotated capture ${d.id}`} className="h-full w-full object-cover" />
                <div className="pointer-events-none absolute left-[20%] top-[24%] h-24 w-28 rounded-md border-2 border-accent">
                  <span className="absolute -top-6 left-0 whitespace-nowrap rounded-pill bg-surface px-2 py-0.5 text-[10px] font-medium text-white">
                    {d.wasteType} · {d.confidence}%
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="card p-5">
            <p className="mb-4 font-medium text-ink">Classification</p>
            <dl className="grid grid-cols-2 gap-y-4 text-sm sm:grid-cols-3">
              <Field label="Waste Type" value={d.wasteType} />
              <Field label="Context" value={d.context} />
              <Field label="AI Confidence" value={<ConfidenceBadge value={d.confidence} />} />
              <Field label="Status" value={<DetectionStatus status={d.status} />} />
              <Field label="Responsible Authority" value={d.authority} />
              <Field label="Alert" value={d.alertStatus} />
            </dl>
          </div>

          <div className="card p-5">
            <p className="mb-4 font-medium text-ink">Location & Timestamp</p>
            <dl className="grid grid-cols-2 gap-y-4 text-sm sm:grid-cols-3">
              <Field label="Location" value={<span className="flex items-center gap-1.5"><MapPin size={13} />{d.location}</span>} />
              <Field label="GPS Coordinates" value={<span className="font-mono text-xs">{d.latitude.toFixed(4)}, {d.longitude.toFixed(4)}</span>} />
              <Field
                label="Captured"
                value={
                  <span className="flex items-center gap-1.5">
                    <Clock size={13} />
                    {new Date(d.timestamp).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}
                  </span>
                }
              />
            </dl>
          </div>
        </div>

        <div className="space-y-6">
          <div className="card p-5">
            <p className="mb-4 font-medium text-ink">Actions</p>
            <div className="flex flex-col gap-2.5">
              <button onClick={handleVerify} disabled={busy || d.status !== "Pending Review"} className="btn-outline w-full justify-center disabled:opacity-40">
                <ShieldCheck size={15} /> Verify Detection
              </button>
              <button onClick={handleSendAlert} disabled={busy || d.alertStatus === "Sent"} className="btn-accent w-full justify-center disabled:opacity-40">
                <Send size={15} /> {d.alertStatus === "Sent" ? "Alert Sent" : "Send Alert"}
              </button>
              <button onClick={handleResolve} disabled={busy || d.status === "Resolved"} className="btn-primary w-full justify-center disabled:opacity-40">
                <CheckCircle2 size={15} /> Mark Resolved
              </button>
            </div>
          </div>

          <div className="card p-5">
            <p className="mb-3 flex items-center gap-1.5 font-medium text-ink">
              <Navigation size={15} /> Nearby Context
            </p>
            <p className="text-sm leading-relaxed text-muted">
              This site was classified as <span className="font-medium text-ink">{d.context}</span>. Detections near
              a {d.context.toLowerCase()} are automatically routed to{" "}
              <span className="font-medium text-ink">{d.authority}</span> for faster response.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({ label, value }) {
  return (
    <div>
      <dt className="text-xs text-muted">{label}</dt>
      <dd className="mt-1 font-medium text-ink">{value}</dd>
    </div>
  );
}
