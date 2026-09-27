export default function LoadingSpinner({ label = "Loading…", size = 22 }) {
  return (
    <div className="flex items-center justify-center gap-3 py-16 text-muted" role="status" aria-live="polite">
      <span
        className="inline-block animate-spin rounded-full border-2 border-ink/15 border-t-accent"
        style={{ width: size, height: size }}
      />
      <span className="text-sm">{label}</span>
    </div>
  );
}
