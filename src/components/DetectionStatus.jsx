const STYLES = {
  "Suspected Illegal": "bg-danger/10 text-danger",
  "Pending Review": "bg-warning/15 text-accent-deep",
  Resolved: "bg-success/10 text-success",
  "Requires Verification": "bg-warning/15 text-accent-deep",
  "No Waste Detected": "bg-ink/8 text-muted",
  "Suspected Illegal Dumping": "bg-danger/10 text-danger",
};

export default function DetectionStatus({ status, className = "" }) {
  const style = STYLES[status] || "bg-ink/8 text-muted";
  return (
    <span className={`inline-flex items-center rounded-pill px-3 py-1 text-xs font-semibold ${style} ${className}`}>
      {status}
    </span>
  );
}
