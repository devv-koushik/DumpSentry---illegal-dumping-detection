import { useEffect, useMemo, useState } from "react";
import { Search, LayoutGrid, List } from "lucide-react";
import PageHeader from "../components/PageHeader";
import DetectionCard from "../components/DetectionCard";
import DetectionTable from "../components/DetectionTable";
import LoadingSpinner from "../components/LoadingSpinner";
import EmptyState from "../components/EmptyState";
import { fetchDetections } from "../services/mockDetections";
import { WASTE_TYPES, CONTEXTS, STATUSES } from "../data/detections";

export default function Detections() {
  const [all, setAll] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("All");
  const [context, setContext] = useState("All");
  const [wasteType, setWasteType] = useState("All");
  const [view, setView] = useState("grid");

  useEffect(() => {
    fetchDetections().then((d) => {
      setAll(d);
      setLoading(false);
    });
  }, []);

  const filtered = useMemo(() => {
    return all.filter((d) => {
      const q = query.toLowerCase();
      const matchesQuery =
        !q || d.id.toLowerCase().includes(q) || d.location.toLowerCase().includes(q);
      const matchesStatus = status === "All" || d.status === status;
      const matchesContext = context === "All" || d.context === context;
      const matchesWaste = wasteType === "All" || d.wasteType === wasteType;
      return matchesQuery && matchesStatus && matchesContext && matchesWaste;
    });
  }, [all, query, status, context, wasteType]);

  return (
    <div>
      <PageHeader title="Detections" description={`${filtered.length} of ${all.length} detections shown`} />

      <div className="mb-6 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search size={15} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search ID or location…"
            className="w-full rounded-pill border border-ink/10 bg-white py-2 pl-9 pr-4 text-sm outline-none focus:border-ink/30"
          />
        </div>

        <Select label="Status" value={status} onChange={setStatus} options={["All", ...STATUSES]} />
        <Select label="Context" value={context} onChange={setContext} options={["All", ...CONTEXTS]} />
        <Select label="Waste Type" value={wasteType} onChange={setWasteType} options={["All", ...WASTE_TYPES]} />

        <div className="ml-auto flex items-center gap-1 rounded-pill border border-ink/10 bg-white p-1">
          <button
            onClick={() => setView("grid")}
            className={`grid h-7 w-7 place-items-center rounded-pill ${view === "grid" ? "bg-ink text-white" : "text-muted"}`}
            aria-label="Grid view"
          >
            <LayoutGrid size={14} />
          </button>
          <button
            onClick={() => setView("table")}
            className={`grid h-7 w-7 place-items-center rounded-pill ${view === "table" ? "bg-ink text-white" : "text-muted"}`}
            aria-label="Table view"
          >
            <List size={14} />
          </button>
        </div>
      </div>

      {loading ? (
        <LoadingSpinner label="Loading detections…" />
      ) : filtered.length === 0 ? (
        <EmptyState title="No detections match your filters" description="Try clearing a filter or searching a different term." />
      ) : view === "grid" ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((d, i) => (
            <DetectionCard key={d.id} detection={d} delay={Math.min(i * 0.04, 0.3)} />
          ))}
        </div>
      ) : (
        <DetectionTable detections={filtered} />
      )}
    </div>
  );
}

function Select({ label, value, onChange, options }) {
  return (
    <select
      aria-label={label}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="rounded-pill border border-ink/10 bg-white px-3.5 py-2 text-sm text-ink outline-none focus:border-ink/30"
    >
      {options.map((o) => (
        <option key={o} value={o}>
          {label}: {o}
        </option>
      ))}
    </select>
  );
}
