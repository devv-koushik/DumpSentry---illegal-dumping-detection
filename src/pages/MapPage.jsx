import { useEffect, useMemo, useState, useCallback } from "react";
import { Search, Compass, Shield, RefreshCw } from "lucide-react";
import PageHeader from "../components/PageHeader";
import MapView from "../components/MapView";
import LoadingSpinner from "../components/LoadingSpinner";
import WardSelectionWizard from "../components/WardSelectionWizard";
import WardAuthorityCard from "../components/WardAuthorityCard";
import EditWardAuthorityModal from "../components/EditWardAuthorityModal";
import { fetchDetections } from "../services/mockDetections";
import {
  getStoredWards,
  getLandmarks,
  subscribeWards,
  updateWard,
  isPointInPolygon,
  resetWardsToDefaults,
} from "../services/wardService";
import { useAuth } from "../context/AuthContext";

const STATUS_FILTERS = ["All", "Suspected Illegal", "Pending Review", "Resolved"];
const LEGEND = [
  { label: "Suspected Illegal", color: "#c94b3f" },
  { label: "Pending Review", color: "#e2a33b" },
  { label: "Resolved", color: "#3f8a5c" },
];

export default function MapPage() {
  const { isAdmin } = useAuth();
  const [allDetections, setAllDetections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("All");
  const [textQuery, setTextQuery] = useState("");

  // Ward & Authority State
  const [wards, setWards] = useState(() => getStoredWards());
  const [landmarks, setLandmarks] = useState(() => getLandmarks());
  const [selectedZone, setSelectedZone] = useState("All");
  const [selectedWard, setSelectedWard] = useState(null);
  const [selectedLandmark, setSelectedLandmark] = useState(null);
  const [editingWard, setEditingWard] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Map visualization controls
  const [filterToWard, setFilterToWard] = useState(false);
  const [showAllBoundaries, setShowAllBoundaries] = useState(true);

  // Load detections
  useEffect(() => {
    fetchDetections().then((d) => {
      setAllDetections(d);
      setLoading(false);
    });
  }, []);

  // Subscribe to changes in stored wards
  useEffect(() => {
    const unsubscribe = subscribeWards((updatedWards) => {
      setWards(updatedWards);
      setLandmarks(getLandmarks(updatedWards));
      if (selectedWard) {
        const refreshed = updatedWards.find((w) => w.id === selectedWard.id);
        if (refreshed) setSelectedWard(refreshed);
      }
    });
    return unsubscribe;
  }, [selectedWard]);

  // Handle Step 1: Choose Location / Zone
  const handleSelectZone = useCallback((zone) => {
    setSelectedZone(zone);
    setSelectedLandmark(null);
    if (zone === "All") {
      // Don't auto-clear ward if user wants all zones
    } else {
      // If selected ward is not in this zone, pick first ward in zone or clear
      const wardsInZone = wards.filter((w) => w.zone === zone);
      if (wardsInZone.length > 0 && (!selectedWard || selectedWard.zone !== zone)) {
        setSelectedWard(wardsInZone[0]);
      }
    }
  }, [wards, selectedWard]);

  // Handle Step 2: Choose Ward
  const handleSelectWard = useCallback((ward) => {
    setSelectedWard(ward);
    setSelectedLandmark(null);
    if (ward && ward.zone) {
      setSelectedZone(ward.zone);
    }
  }, []);

  // Handle Landmark Selection
  const handleSelectLandmark = useCallback((landmark) => {
    setSelectedLandmark(landmark);
    // Find matching ward for this landmark
    const targetWard = wards.find(
      (w) =>
        w.id === landmark.wardId ||
        (w.landmarks && w.landmarks.some((lm) => lm.name === landmark.name))
    );
    if (targetWard) {
      setSelectedWard(targetWard);
      setSelectedZone(targetWard.zone);
    }
  }, [wards]);

  // Clear Selection
  const handleClearSelection = useCallback(() => {
    setSelectedWard(null);
    setSelectedLandmark(null);
    setSelectedZone("All");
    setFilterToWard(false);
  }, []);

  // Edit Authority
  const handleOpenEdit = useCallback((wardToEdit) => {
    setEditingWard(wardToEdit || selectedWard || wards[0]);
    setIsEditModalOpen(true);
  }, [selectedWard, wards]);

  const handleSaveWardAuthority = useCallback(async (wardId, updatedData) => {
    await updateWard(wardId, updatedData);
  }, []);

  // Filter detections by status and text query
  const filteredDetections = useMemo(() => {
    return allDetections.filter((d) => {
      const matchesStatus = statusFilter === "All" || d.status === statusFilter;
      const matchesQuery =
        !textQuery ||
        d.location.toLowerCase().includes(textQuery.toLowerCase()) ||
        d.wasteType.toLowerCase().includes(textQuery.toLowerCase()) ||
        d.id.toLowerCase().includes(textQuery.toLowerCase());
      return matchesStatus && matchesQuery;
    });
  }, [allDetections, statusFilter, textQuery]);

  // Detections inside the selected ward boundary
  const wardDetectionsCount = useMemo(() => {
    if (!selectedWard || !selectedWard.boundary) return 0;
    return allDetections.filter((d) =>
      isPointInPolygon([d.latitude, d.longitude], selectedWard.boundary)
    ).length;
  }, [allDetections, selectedWard]);

  return (
    <div className="flex flex-col min-h-[calc(100vh-4.5rem)] space-y-4">
      {/* ── Top Header & Global Actions ── */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <PageHeader
          title="Municipal Ward & Surveillance Map"
          description="Interactive geospatial boundary selection, authority directory, and illegal dumping hotspot monitoring."
        />

        <div className="flex items-center gap-2">
          {isAdmin ? (
            <>
              {selectedWard && (
                <button
                  onClick={() => handleOpenEdit(selectedWard)}
                  className="inline-flex items-center gap-1.5 rounded-pill bg-ink px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-surface2 transition-all shadow-xs"
                >
                  <Shield size={13} className="text-accent" />
                  <span>Edit {selectedWard.wardNumber} Authority</span>
                </button>
              )}

              <button
                onClick={() => {
                  if (window.confirm("Reset all wards and authorities to default official registry?")) {
                    const defaults = resetWardsToDefaults();
                    setWards(defaults);
                    setLandmarks(getLandmarks(defaults));
                    if (selectedWard) {
                      setSelectedWard(defaults.find((w) => w.id === selectedWard.id) || null);
                    }
                  }
                }}
                title="Reset Ward Directory to Defaults (Admin Only)"
                className="flex items-center gap-1 rounded-pill border border-line bg-white px-3 py-1.5 text-xs font-medium text-muted hover:text-ink hover:bg-paper transition-colors"
              >
                <RefreshCw size={12} />
                <span className="hidden sm:inline">Reset Defaults</span>
              </button>
            </>
          ) : (
            <span className="inline-flex items-center gap-1.5 rounded-pill bg-paper border border-line px-3 py-1 text-[11px] font-medium text-muted">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              Public Civic View
            </span>
          )}
        </div>
      </div>

      {/* ── Filter Bar & Status Chips ── */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-card border border-ink/10 bg-white p-3 shadow-xs">
        <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[280px]">
          <div className="relative min-w-[220px] max-w-xs flex-1">
            <Search size={14} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
            <input
              value={textQuery}
              onChange={(e) => setTextQuery(e.target.value)}
              placeholder="Search location, waste type, incident ID..."
              className="w-full rounded-pill border border-line bg-paper/50 py-1.5 pl-9 pr-4 text-xs outline-none focus:border-ink focus:bg-white"
            />
          </div>

          <div className="flex flex-wrap gap-1.5">
            {STATUS_FILTERS.map((f) => (
              <button
                key={f}
                onClick={() => setStatusFilter(f)}
                className={`rounded-pill px-3 py-1 text-xs font-medium transition-colors ${
                  statusFilter === f
                    ? "bg-ink text-white"
                    : "border border-line bg-white text-muted hover:text-ink"
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs text-muted">
          {LEGEND.map((l) => (
            <span key={l.label} className="flex items-center gap-1.5 text-[11px]">
              <span className="h-2 w-2 rounded-full" style={{ background: l.color }} /> {l.label}
            </span>
          ))}
        </div>
      </div>

      {/* ── Main Dual-Panel Workspace ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 flex-1">
        {/* Left Column: Step-by-Step Selection Wizard & Ward Authority Card (5 cols) */}
        <div className="lg:col-span-5 flex flex-col space-y-4 order-2 lg:order-1">
          {/* Step-by-Step Wizard Component */}
          <WardSelectionWizard
            wards={wards}
            landmarks={landmarks}
            selectedZone={selectedZone}
            selectedWard={selectedWard}
            selectedLandmark={selectedLandmark}
            isAdmin={isAdmin}
            onSelectZone={handleSelectZone}
            onSelectWard={handleSelectWard}
            onSelectLandmark={handleSelectLandmark}
            onClearSelection={handleClearSelection}
            onOpenEditModal={() => handleOpenEdit(selectedWard)}
            filterToWard={filterToWard}
            onToggleFilterToWard={setFilterToWard}
            showAllBoundaries={showAllBoundaries}
            onToggleShowAllBoundaries={setShowAllBoundaries}
          />

          {/* Ward Authority Card (Shown prominently when a ward is selected) */}
          {selectedWard ? (
            <WardAuthorityCard
              ward={selectedWard}
              isAdmin={isAdmin}
              onEdit={handleOpenEdit}
              onSelectLandmark={handleSelectLandmark}
              onClose={() => setSelectedWard(null)}
            />
          ) : (
            <div className="rounded-card border border-dashed border-line bg-paper/60 p-6 text-center text-muted">
              <Compass size={32} className="mx-auto text-accent-deep mb-2 opacity-80" />
              <h4 className="font-bold text-ink text-sm">No Ward Selected</h4>
              <p className="text-xs text-muted mt-1 max-w-xs mx-auto">
                Follow Step 1 and Step 2 above, or pick a landmark to highlight its boundary and display responsible municipal authorities.
              </p>
            </div>
          )}
        </div>

        {/* Right Column: Full-Featured Map View (7 cols) */}
        <div className="lg:col-span-7 flex flex-col min-h-[520px] lg:min-h-0 order-1 lg:order-2">
          {loading ? (
            <LoadingSpinner label="Loading municipal geospatial data..." />
          ) : (
            <div className="relative flex-1 h-full min-h-[520px] rounded-card overflow-hidden shadow-card border border-ink/10">
              {/* Map Floating Status Pill */}
              {selectedWard && (
                <div className="absolute top-3 left-3 z-[1000] flex items-center gap-2 rounded-pill bg-white/95 px-3 py-1.5 shadow-md border border-line backdrop-blur-md text-xs">
                  <span
                    className="h-2.5 w-2.5 rounded-full animate-pulse"
                    style={{ backgroundColor: selectedWard.color || "#e2a33b" }}
                  />
                  <span className="font-bold text-ink">{selectedWard.wardNumber}: {selectedWard.name}</span>
                  <span className="text-[11px] text-muted">({wardDetectionsCount} dumping hotspots in boundary)</span>
                  <button
                    onClick={handleClearSelection}
                    className="ml-1 text-muted hover:text-ink font-bold"
                    title="Clear Boundary"
                  >
                    ×
                  </button>
                </div>
              )}

              <MapView
                detections={filteredDetections}
                wards={wards}
                selectedWard={selectedWard}
                selectedLandmark={selectedLandmark}
                onSelectWard={handleSelectWard}
                onSelectLandmark={handleSelectLandmark}
                showAllBoundaries={showAllBoundaries}
                filterToWard={filterToWard}
                center={selectedWard ? selectedWard.center : [22.56, 88.38]}
                zoom={selectedWard ? selectedWard.zoom || 15 : 12}
                height="100%"
                className="h-full w-full"
              />
            </div>
          )}
        </div>
      </div>

      {/* ── Edit Authority Modal (Admin Only) ── */}
      {isAdmin && isEditModalOpen && (
        <EditWardAuthorityModal
          key={editingWard?.id || "modal"}
          ward={editingWard}
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          onSave={handleSaveWardAuthority}
        />
      )}
    </div>
  );
}
