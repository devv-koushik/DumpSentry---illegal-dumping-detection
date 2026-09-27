import { ShieldCheck } from "lucide-react";

export default function AuthorityBadge({ authority }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-pill bg-surface2/[.06] px-3 py-1 text-xs font-medium text-ink">
      <ShieldCheck size={13} className="text-accent-deep" />
      {authority}
    </span>
  );
}
