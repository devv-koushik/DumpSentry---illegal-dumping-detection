export default function ConfidenceBadge({ value }) {
  const tone = value >= 85 ? "text-danger" : value >= 70 ? "text-accent-deep" : "text-muted";
  return (
    <span className={`inline-flex items-center gap-1.5 font-mono text-xs font-medium ${tone}`}>
      <span className="relative h-1.5 w-10 overflow-hidden rounded-pill bg-ink/10">
        <span
          className="absolute inset-y-0 left-0 rounded-pill bg-current"
          style={{ width: `${value}%` }}
        />
      </span>
      {value}%
    </span>
  );
}
