import { useEffect, useMemo, useState } from "react";
import { Search, LayoutGrid, List } from "lucide-react";
import PageHeader from "../components/PageHeader";
import DetectionCard from "../components/DetectionCard";
import DetectionTable from "../components/DetectionTable";
import LoadingSpinner from "../components/LoadingSpinner";
import EmptyState from "../components/EmptyState";
import { fetchDetections, deleteDetection } from "../services/api";

const REAL_YOLO_CLASSES = [
  "construction_waste",
  "appliances",
  "electronic_waste",
  "furniture",
  "metal_waste",
  "plastic_waste",
  "wood_waste",
  "vehicle_waste",
  "tyre_waste",
  "paper_waste",
  "asbestos",
  "textile_waste",
  "mixed_waste",
];

const REAL_CONTEXTS = [
  "HEALTHCARE",
  "ROADSIDE",
  "EDUCATIONAL",
  "WATER_BODY",
  "ENVIRONMENTAL_PROTECTED",
  "INDUSTRIAL",
  "RESIDENTIAL",
  "COMMERCIAL",
  "TRANSPORT",
  "PUBLIC_AREA",
  "AGRICULTURAL",
  "OTHER_UNKNOWN",
];

const REAL_STATUSES = [
  "Suspected Illegal",
  "Pending Review",
  "Verified",
  "Rejected",
  "Resolved",
];

export default function Detections() {
  const [all, setAll] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("All");
  const [context, setContext] = useState("All");
  const [wasteType, setWasteType] = useState("All");
  const [view, setView] = useState("grid");

  useEffect(() => {
    fetchDetections()
      .then((d) => {
        setAll(Array.isArray(d) ? d : []);
        setLoading(false);
      })
      .catch(() => {
        setAll([]);
        setLoading(false);
      });
  }, []);

  const filtered = useMemo(() => {
    return all.filter((d) => {
      const q = query.toLowerCase();
      const matchesQuery =
        !q ||
        (d.id && d.id.toLowerCase().includes(q)) ||
        (d.location && d.location.toLowerCase().includes(q)) ||
        (d.wasteType && d.wasteType.toLowerCase().includes(q));

      const matchesStatus = status === "All" || d.status === status;

      const matchesContext =
        context === "All" ||
        (d.contextType && d.contextType === context) ||
        (d.context && d.context.toLowerCase().includes(context.toLowerCase().replace(/_/g, " ")));

      const matchesWaste =
        wasteType === "All" ||
        (Array.isArray(d.wasteTypes) && d.wasteTypes.includes(wasteType)) ||
        (d.wasteType && d.wasteType.toLowerCase().includes(wasteType.toLowerCase().replace(/_/g, " ")));

      return matchesQuery && matchesStatus && matchesContext && matchesWaste;
    });
  }, [all, query, status, context, wasteType]);

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this detection?")) return;
    try {
      await deleteDetection(id);
      setAll((prev) => prev.filter(d => d.id !== id));
    } catch (err) {
      alert("Failed to delete detection: " + (err.message || "Unknown error"));
    }
  };

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

        <Select label="Status" value={status} onChange={setStatus} options={["All", ...REAL_STATUSES]} />
        <Select label="Context" value={context} onChange={setContext} options={["All", ...REAL_CONTEXTS]} />
        <Select label="Waste Type" value={wasteType} onChange={setWasteType} options={["All", ...REAL_YOLO_CLASSES]} />

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
      ) : all.length === 0 ? (
        <EmptyState
          title="No detections recorded"
          description="No aerial detections have been logged yet. Upload drone imagery to start analyzing waste."
        />
      ) : filtered.length === 0 ? (
        <EmptyState
          title="No detections match your filters"
          description="Try clearing a filter or searching a different term."
        />
      ) : view === "grid" ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((d, i) => (
            <DetectionCard key={d.id} detection={d} delay={Math.min(i * 0.04, 0.3)} onDelete={handleDelete} />
          ))}
        </div>
      ) : (
        <DetectionTable detections={filtered} onDelete={handleDelete} />
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
