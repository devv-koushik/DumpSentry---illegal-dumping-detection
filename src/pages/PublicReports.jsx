import { useState, useEffect } from "react";
import {
  AlertTriangle,
  MapPin,
  CheckCircle2,
  Plane,
  Search,
  ChevronRight,
  Trash2,
} from "lucide-react";
import PageHeader from "../components/PageHeader";
import { useAuth } from "../context/AuthContext";
import { getPublicReports, updateReportStatus, deleteReport } from "../services/publicReports";

const STATUS_TABS = ["All", "Pending Review", "Drone Dispatched", "Resolved"];

export default function PublicReports() {
  const { isAdmin } = useAuth();
  const [reports, setReports] = useState([]);
  const [filterStatus, setFilterStatus] = useState("All");
  const [search, setSearch] = useState("");
  const [selectedReport, setSelectedReport] = useState(null);
  const [toast, setToast] = useState("");

  useEffect(() => {
    async function handleUpdate() {
      const data = await getPublicReports();
      setReports(data);
    }
    handleUpdate();
    window.addEventListener("dumpsentry_reports_updated", handleUpdate);
    return () => {
      window.removeEventListener("dumpsentry_reports_updated", handleUpdate);
    };
  }, []);

  async function handleStatusChange(id, status) {
    const updated = await updateReportStatus(id, status);
    setReports(updated);
    if (selectedReport?.id === id) {
      setSelectedReport((prev) => (prev ? { ...prev, status } : null));
    }
    setToast(`Report #${id} status updated to "${status}".`);
    setTimeout(() => setToast(""), 3000);
  }

  async function handleDelete(e, id) {
    e.stopPropagation();
    if (confirm("Are you sure you want to delete this report?")) {
      const updated = await deleteReport(id);
      setReports(updated);
      if (selectedReport?.id === id) {
        setSelectedReport(null);
      }
      setToast(`Report #${id} deleted.`);
      setTimeout(() => setToast(""), 3000);
    }
  }

  const filtered = reports.filter((r) => {
    const matchesStatus = filterStatus === "All" || r.status === filterStatus;
    const q = search.toLowerCase();
    const matchesSearch =
      !q ||
      r.id.toLowerCase().includes(q) ||
      r.location.toLowerCase().includes(q) ||
      r.problemType.toLowerCase().includes(q) ||
      (r.reporterName && r.reporterName.toLowerCase().includes(q));
    return matchesStatus && matchesSearch;
  });

  return (
      <div className="space-y-6">
        <PageHeader
          title="Citizen Problem Reports"
          description="Inbound illegal dumping reports filed by residents, hospitals, and educational facilities."
          actions={
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-accent/15 px-3 py-1 text-xs font-semibold text-accent-deep uppercase tracking-wider">
                {reports.length} Total Reports
              </span>
            </div>
          }
        />

        {toast && (
          <div className="rounded-xl border border-success/30 bg-success/10 px-4 py-3 text-xs font-medium text-success">
            {toast}
          </div>
        )}

        {/* Filters & Search */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            {STATUS_TABS.map((tab) => (
              <button
                key={tab}
                onClick={() => setFilterStatus(tab)}
                className={`rounded-full px-3.5 py-1.5 text-xs font-medium transition-all ${filterStatus === tab
                    ? "bg-ink text-white shadow-sm"
                    : "border border-line bg-white text-muted hover:text-ink"
                  }`}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="relative min-w-[240px]">
            <Search
              size={13}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted"
            />
            <input
              type="text"
              placeholder="Search ID, location, category..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-full border border-line bg-white py-1.5 pl-8 pr-4 text-xs text-ink outline-none focus:border-accent/40"
            />
          </div>
        </div>

        {/* Reports Layout: List & Detail View */}
        <div className="grid gap-6 lg:grid-cols-12">
          {/* Left Column: List of Reports */}
          <div className={`${selectedReport ? "lg:col-span-5" : "lg:col-span-12"} space-y-3`}>
            {filtered.length === 0 ? (
              <div className="rounded-2xl border border-line bg-white p-12 text-center">
                <AlertTriangle size={32} className="mx-auto text-muted/60 mb-2" />
                <h4 className="text-sm font-bold text-ink">No reports found</h4>
                <p className="mt-1 text-xs text-muted">
                  No citizen complaints match your active filter criteria.
                </p>
              </div>
            ) : (
              filtered.map((report) => {
                const isSelected = selectedReport?.id === report.id;
                return (
                  <div
                    key={report.id}
                    onClick={() => isAdmin && setSelectedReport(report)}
                    className={`rounded-2xl border p-4 transition-all bg-white hover:border-accent/40 ${isAdmin ? "cursor-pointer hover:shadow-card" : ""} ${isSelected
                        ? "border-accent bg-accent/[0.02] shadow-sm"
                        : "border-line"
                      }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-accent-deep">
                            {report.id}
                          </span>
                          <span
                            className={`rounded-full px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider ${report.status === "Pending Review"
                                ? "bg-warning/15 text-accent-deep"
                                : report.status === "Drone Dispatched"
                                  ? "bg-cmd-info/15 text-cmd-info"
                                  : "bg-success/15 text-success"
                              }`}
                          >
                            {report.status}
                          </span>
                          {report.priority === "Urgent" && (
                            <span className="rounded-full bg-danger/10 px-2 py-0.5 text-[9px] font-bold text-danger">
                              Urgent
                            </span>
                          )}
                        </div>
                        <h4 className="mt-1.5 text-xs font-bold text-ink">
                          {report.problemType}
                        </h4>
                        <p className="mt-0.5 flex items-center gap-1 text-[11px] text-muted">
                          <MapPin size={11} className="text-accent flex-shrink-0" />
                          <span className="truncate">{report.location}</span>
                        </p>
                      </div>

                      {report.imagePreview && (
                        <img
                          src={report.imagePreview}
                          alt="Citizen capture"
                          className="h-14 w-14 rounded-xl object-cover border border-line flex-shrink-0"
                        />
                      )}
                    </div>

                    <div className="mt-3 flex items-center justify-between border-t border-line/60 pt-2 text-[10px] text-muted font-mono">
                      <span>
                        {new Date(report.timestamp).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                      {isAdmin && (
                        <div className="flex items-center gap-3">
                          <button
                            onClick={(e) => handleDelete(e, report.id)}
                            className="text-muted hover:text-danger p-1 rounded transition-colors"
                            title="Delete Report"
                          >
                            <Trash2 size={14} />
                          </button>
                          <span className="flex items-center gap-1 text-accent-deep font-sans font-semibold">
                            Inspect <ChevronRight size={11} />
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Right Column: Detailed Inspector */}
          {selectedReport && (
            <div className="lg:col-span-7">
              <div className="sticky top-20 rounded-2xl border border-line bg-white p-6 shadow-pop space-y-5">
                <div className="flex items-center justify-between border-b border-line pb-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm font-bold text-ink">
                        {selectedReport.id}
                      </span>
                      <span className="rounded-full bg-paper2 px-2.5 py-0.5 text-[10px] font-semibold text-muted uppercase">
                        {selectedReport.context}
                      </span>
                    </div>
                    <h3 className="mt-1 text-base font-bold text-ink">
                      {selectedReport.problemType}
                    </h3>
                  </div>
                  <button
                    onClick={() => setSelectedReport(null)}
                    className="rounded-lg p-1.5 text-muted hover:bg-paper2 hover:text-ink transition-colors"
                  >
                    ✕
                  </button>
                </div>

                {/* Evidence Image */}
                {selectedReport.imagePreview && (
                  <div className="overflow-hidden rounded-xl border border-line bg-paper">
                    <img
                      src={selectedReport.imagePreview}
                      alt="Citizen Evidence"
                      className="max-h-64 w-full object-cover"
                    />
                  </div>
                )}

                {/* Key Attributes */}
                <div className="grid gap-3 sm:grid-cols-2 rounded-xl bg-paper/60 p-4 border border-line text-xs">
                  <div>
                    <span className="text-[10px] uppercase font-bold tracking-wider text-muted block">
                      Reported Location
                    </span>
                    <span className="font-medium text-ink mt-0.5 block">
                      {selectedReport.location}
                    </span>
                    {selectedReport.landmark && (
                      <span className="text-[11px] text-muted block mt-0.5">
                        Landmark: {selectedReport.landmark}
                      </span>
                    )}
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold tracking-wider text-muted block">
                      Assigned Municipal Authority
                    </span>
                    <span className="font-medium text-accent-deep mt-0.5 block">
                      {selectedReport.assignedAuthority || "City Corporation SWM"}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold tracking-wider text-muted block">
                      Citizen Contact
                    </span>
                    <span className="font-medium text-ink mt-0.5 block">
                      {selectedReport.reporterName || "Anonymous Resident"}
                      {selectedReport.reporterContact && ` (${selectedReport.reporterContact})`}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold tracking-wider text-muted block">
                      Filed At
                    </span>
                    <span className="font-mono text-muted mt-0.5 block">
                      {new Date(selectedReport.timestamp).toLocaleString("en-IN")}
                    </span>
                  </div>
                </div>

                {/* Description */}
                <div>
                  <h5 className="text-[11px] font-bold uppercase tracking-wider text-muted mb-1">
                    Citizen Description
                  </h5>
                  <p className="rounded-xl border border-line bg-paper/40 p-3.5 text-xs leading-relaxed text-ink/90">
                    {selectedReport.description || "No additional comments provided."}
                  </p>
                </div>

                {/* Operator Actions */}
                <div className="border-t border-line pt-4">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted block mb-2.5">
                    Command Operator Workflow
                  </span>
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      onClick={() =>
                        handleStatusChange(selectedReport.id, "Drone Dispatched")
                      }
                      className="flex items-center gap-1.5 rounded-xl bg-accent px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-accent-deep transition-all"
                    >
                      <Plane size={13} />
                      Dispatch Patrol Drone
                    </button>
                    <button
                      onClick={() =>
                        handleStatusChange(selectedReport.id, "Resolved")
                      }
                      className="flex items-center gap-1.5 rounded-xl border border-success/30 bg-success/10 px-4 py-2 text-xs font-semibold text-success hover:bg-success hover:text-white transition-all"
                    >
                      <CheckCircle2 size={13} />
                      Mark Resolved
                    </button>
                    <button
                      onClick={() =>
                        handleStatusChange(selectedReport.id, "Pending Review")
                      }
                      className="flex items-center gap-1.5 rounded-xl border border-line bg-white px-3 py-2 text-xs font-medium text-muted hover:text-ink transition-all"
                    >
                      Set Pending
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
  );
}
