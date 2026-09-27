import { useEffect, useMemo, useState } from "react";
import { Search } from "lucide-react";
import PageHeader from "../components/PageHeader";
import MapView from "../components/MapView";
import LoadingSpinner from "../components/LoadingSpinner";
import { fetchDetections } from "../services/mockDetections";

const FILTERS = ["All", "Suspected Illegal", "Pending Review", "Resolved"];
const LEGEND = [
  { label: "Suspected Illegal", color: "#c94b3f" },
  { label: "Pending Review", color: "#e2a33b" },
  { label: "Resolved", color: "#3f8a5c" },
];

export default function MapPage() {
  const [all, setAll] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("All");
  const [query, setQuery] = useState("");

  useEffect(() => {
    fetchDetections().then((d) => {
      setAll(d);
      setLoading(false);
    });
  }, []);

  const filtered = useMemo(() => {
    return all.filter((d) => {
      const matchesFilter = filter === "All" || d.status === filter;
      const matchesQuery = !query || d.location.toLowerCase().includes(query.toLowerCase());
      return matchesFilter && matchesQuery;
    });
  }, [all, filter, query]);

  return (
    <div className="flex h-[calc(100vh-5.5rem)] flex-col">
      <PageHeader title="Detection Map" description={`${filtered.length} sites shown`} />

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="relative min-w-[200px] max-w-xs flex-1">
          <Search size={15} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search location…"
            className="w-full rounded-pill border border-ink/10 bg-white py-2 pl-9 pr-4 text-sm outline-none focus:border-ink/30"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          {FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`rounded-pill px-3.5 py-1.5 text-xs font-medium transition-colors ${
                filter === f ? "bg-ink text-white" : "border border-ink/10 bg-white text-muted hover:text-ink"
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        <div className="ml-auto flex items-center gap-4 text-xs text-muted">
          {LEGEND.map((l) => (
            <span key={l.label} className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full" style={{ background: l.color }} /> {l.label}
            </span>
          ))}
        </div>
      </div>

      {loading ? <LoadingSpinner label="Loading map…" /> : <MapView detections={filtered} height="100%" />}
    </div>
  );
}
