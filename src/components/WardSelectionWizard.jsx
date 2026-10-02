import { useState, useMemo } from "react";
import {
  Compass,
  Landmark,
  Search,
  X,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import { ZONES } from "../data/wardAuthorities";

export default function WardSelectionWizard({
  wards = [],
  landmarks = [],
  selectedZone = "",
  selectedWard = null,
  selectedLandmark = null,
  isAdmin = false,
  onSelectZone = () => {},
  onSelectWard = () => {},
  onSelectLandmark = () => {},
  onClearSelection = () => {},
  onOpenEditModal = () => {},
  filterToWard = false,
  onToggleFilterToWard = () => {},
  showAllBoundaries = true,
  onToggleShowAllBoundaries = () => {},
}) {
  const [activeTab, setActiveTab] = useState("steps"); // 'steps' | 'landmark'
  const [landmarkSearch, setLandmarkSearch] = useState("");
  const [wardSearch, setWardSearch] = useState("");

  // Wards available under the chosen zone
  const availableWards = useMemo(() => {
    let list = wards;
    if (selectedZone && selectedZone !== "All") {
      list = list.filter((w) => w.zone === selectedZone);
    }
    if (wardSearch.trim()) {
      const q = wardSearch.toLowerCase();
      list = list.filter(
        (w) =>
          w.wardNumber.toLowerCase().includes(q) ||
          w.name.toLowerCase().includes(q) ||
          w.borough.toLowerCase().includes(q) ||
          w.authorities?.councillor?.name?.toLowerCase().includes(q)
      );
    }
    return list;
  }, [wards, selectedZone, wardSearch]);

  // Filtered landmarks for search
  const filteredLandmarks = useMemo(() => {
    if (!landmarkSearch.trim()) return landmarks.slice(0, 8);
    const q = landmarkSearch.toLowerCase();
    return landmarks.filter(
      (lm) =>
        lm.name.toLowerCase().includes(q) ||
        lm.type?.toLowerCase().includes(q) ||
        lm.wardName?.toLowerCase().includes(q) ||
        lm.wardNumber?.toLowerCase().includes(q)
    );
  }, [landmarks, landmarkSearch]);

  return (
    <div className="rounded-card border border-ink/10 bg-white/95 p-4 shadow-card backdrop-blur-md">
      {/* ── Selection Method Tabs ── */}
      <div className="flex items-center justify-between border-b border-line pb-3 mb-3">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent/20 text-accent-deep">
            <Compass size={16} />
          </div>
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-ink">
              Ward Boundary & Authority Selector
            </h3>
            <p className="text-[11px] text-muted">Navigate by location, ward, or famous landmark</p>
          </div>
        </div>

        <div className="flex rounded-pill bg-paper p-0.5 border border-line">
          <button
            onClick={() => setActiveTab("steps")}
            className={`rounded-pill px-2.5 py-1 text-[11px] font-semibold transition-all ${
              activeTab === "steps"
                ? "bg-ink text-white shadow-sm"
                : "text-muted hover:text-ink"
            }`}
          >
            Step-by-Step
          </button>
          <button
            onClick={() => setActiveTab("landmark")}
            className={`rounded-pill px-2.5 py-1 text-[11px] font-semibold transition-all flex items-center gap-1 ${
              activeTab === "landmark"
                ? "bg-ink text-white shadow-sm"
                : "text-muted hover:text-ink"
            }`}
          >
            <Landmark size={11} /> By Landmark
          </button>
        </div>
      </div>

      {/* ── Active Selection Breadcrumbs ── */}
      {selectedWard && (
        <div className="mb-3.5 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-accent/30 bg-accent/5 p-2.5 text-xs">
          <div className="flex flex-wrap items-center gap-1.5 font-medium text-ink">
            <span className="flex items-center gap-1 text-accent-deep">
              <Sparkles size={13} /> Active Boundary:
            </span>
            <span className="rounded bg-accent/20 px-1.5 py-0.5 font-bold font-mono text-[11px]">
              {selectedWard.wardNumber}
            </span>
            <span className="font-semibold text-ink">{selectedWard.name}</span>
            <span className="text-muted text-[11px]">({selectedWard.borough} · {selectedWard.zone})</span>
            {selectedLandmark && (
              <span className="ml-1 inline-flex items-center gap-1 rounded bg-white px-1.5 py-0.5 text-[11px] text-accent-deep font-semibold shadow-xs border border-line">
                <Landmark size={11} /> {selectedLandmark.name}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {isAdmin && (
              <button
                onClick={onOpenEditModal}
                className="rounded-pill bg-ink px-2.5 py-1 text-[11px] font-semibold text-white hover:bg-surface2 transition-colors shadow-xs"
              >
                Edit Authority
              </button>
            )}
            <button
              onClick={onClearSelection}
              title="Reset Selection"
              className="flex h-6 w-6 items-center justify-center rounded-full bg-black/5 hover:bg-black/10 text-muted hover:text-ink transition-colors"
            >
              <X size={13} />
            </button>
          </div>
        </div>
      )}

      {/* ── MODE 1: STEP-BY-STEP SELECTION ── */}
      {activeTab === "steps" && (
        <div className="space-y-3.5">
          {/* STEP 1: CHOOSE LOCATION / ZONE */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-ink">
                <span className="flex h-4 w-4 items-center justify-center rounded-full bg-ink text-[9px] font-bold text-white">
                  1
                </span>
                Step 1: Choose Location / Region
              </label>
              {selectedZone && selectedZone !== "All" && (
                <button
                  onClick={() => onSelectZone("All")}
                  className="text-[10px] text-muted hover:text-ink underline"
                >
                  View All Zones
                </button>
              )}
            </div>

            <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-4">
              <button
                onClick={() => onSelectZone("All")}
                className={`rounded-lg border px-2.5 py-2 text-left text-xs transition-all ${
                  !selectedZone || selectedZone === "All"
                    ? "border-ink bg-ink text-white font-semibold shadow-xs"
                    : "border-line bg-paper/60 text-muted hover:border-ink/30 hover:text-ink"
                }`}
              >
                <p className="truncate font-medium">All Locations</p>
                <p className="text-[10px] opacity-75">{wards.length} Wards Listed</p>
              </button>

              {ZONES.map((zone) => {
                const isSelected = selectedZone === zone;
                const count = wards.filter((w) => w.zone === zone).length;
                return (
                  <button
                    key={zone}
                    onClick={() => onSelectZone(zone)}
                    className={`rounded-lg border px-2.5 py-2 text-left text-xs transition-all ${
                      isSelected
                        ? "border-accent-deep bg-accent/15 text-ink font-semibold shadow-xs ring-1 ring-accent-deep"
                        : "border-line bg-paper/60 text-muted hover:border-ink/30 hover:text-ink"
                    }`}
                  >
                    <p className="truncate font-medium">{zone}</p>
                    <p className="text-[10px] text-muted">{count} Wards</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* STEP 2: CHOOSE WARD */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-ink">
                <span className="flex h-4 w-4 items-center justify-center rounded-full bg-accent-deep text-[9px] font-bold text-white">
                  2
                </span>
                Step 2: Choose Ward (Highlights Boundary on Map)
              </label>
              <span className="text-[10px] text-muted">
                {availableWards.length} Wards in selection
              </span>
            </div>

            {/* Quick search input */}
            <div className="relative mb-2">
              <Search
                size={13}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted"
              />
              <input
                value={wardSearch}
                onChange={(e) => setWardSearch(e.target.value)}
                placeholder="Filter wards by number, name, or councillor..."
                className="w-full rounded-lg border border-line bg-white py-1.5 pl-8 pr-3 text-xs outline-none focus:border-ink"
              />
              {wardSearch && (
                <button
                  onClick={() => setWardSearch("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted hover:text-ink"
                >
                  <X size={12} />
                </button>
              )}
            </div>

            {/* Wards scrollable selector */}
            <div className="max-h-44 overflow-y-auto space-y-1.5 pr-1">
              {availableWards.map((w) => {
                const isSelected = selectedWard && selectedWard.id === w.id;
                return (
                  <div
                    key={w.id}
                    onClick={() => onSelectWard(w)}
                    className={`group flex cursor-pointer items-center justify-between rounded-lg border p-2 text-xs transition-all ${
                      isSelected
                        ? "border-accent bg-accent/15 ring-2 ring-accent text-ink font-medium shadow-xs"
                        : "border-line bg-white hover:border-ink/30 hover:bg-paper"
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        className="h-2.5 w-2.5 rounded-full flex-shrink-0"
                        style={{ backgroundColor: w.color || "#e2a33b" }}
                      />
                      <span className="font-mono font-bold text-ink shrink-0">
                        {w.wardNumber}
                      </span>
                      <div className="truncate">
                        <p className="truncate font-semibold text-ink">{w.name}</p>
                        <p className="text-[10px] text-muted truncate">
                          {w.borough} · {w.authorities?.councillor?.name || "Civic Desk"}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0 pl-2">
                      <span className="rounded bg-black/5 px-1.5 py-0.5 text-[10px] font-mono text-muted">
                        {w.stats?.activeHotspots || 0} alerts
                      </span>
                      <ChevronRight
                        size={14}
                        className={`transition-transform text-muted ${
                          isSelected ? "text-accent-deep translate-x-0.5" : "group-hover:translate-x-0.5"
                        }`}
                      />
                    </div>
                  </div>
                );
              })}

              {availableWards.length === 0 && (
                <p className="py-4 text-center text-xs text-muted">
                  No wards match your search filter.
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── MODE 2: BY LANDMARK SELECTION ── */}
      {activeTab === "landmark" && (
        <div className="space-y-3">
          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider text-ink block mb-1">
              Search by Landmark (Auto-Identifies Ward & Boundary)
            </label>
            <p className="text-[11px] text-muted mb-2">
              Select any prominent landmark to automatically identify its municipal ward and highlight its boundary.
            </p>

            <div className="relative">
              <Search
                size={14}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted"
              />
              <input
                value={landmarkSearch}
                onChange={(e) => setLandmarkSearch(e.target.value)}
                placeholder="Type landmark (e.g., Victoria Memorial, Eco Park, Kalighat Temple)..."
                className="w-full rounded-lg border border-line bg-white py-2 pl-9 pr-4 text-xs outline-none focus:border-ink shadow-xs"
              />
              {landmarkSearch && (
                <button
                  onClick={() => setLandmarkSearch("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-ink"
                >
                  <X size={13} />
                </button>
              )}
            </div>
          </div>

          {/* Quick Landmark Pills */}
          <div>
            <p className="text-[10px] font-semibold text-muted uppercase tracking-wider mb-1.5">
              Popular Landmarks
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-56 overflow-y-auto pr-1">
              {filteredLandmarks.map((lm) => {
                const isSelected = selectedLandmark && selectedLandmark.name === lm.name;
                return (
                  <button
                    key={lm.id || lm.name}
                    onClick={() => onSelectLandmark(lm)}
                    className={`flex items-start gap-2 rounded-lg border p-2 text-left transition-all ${
                      isSelected
                        ? "border-accent bg-accent/15 ring-2 ring-accent text-ink"
                        : "border-line bg-white hover:border-ink/30 hover:bg-paper"
                    }`}
                  >
                    <div className="mt-0.5 flex h-6 w-6 items-center justify-center rounded-md bg-paper flex-shrink-0 text-accent-deep">
                      <Landmark size={13} />
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-xs text-ink truncate">{lm.name}</p>
                      <p className="text-[10px] text-muted truncate">
                        {lm.type || "Landmark"} · {lm.wardNumber || "Ward"}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ── Visual Map Controls Bar ── */}
      <div className="mt-3.5 pt-3 border-t border-line flex flex-wrap items-center justify-between gap-3 text-xs">
        <label className="flex items-center gap-2 cursor-pointer text-muted hover:text-ink select-none">
          <input
            type="checkbox"
            checked={showAllBoundaries}
            onChange={(e) => onToggleShowAllBoundaries(e.target.checked)}
            className="rounded border-line text-ink accent-ink"
          />
          <span>Show all ward outlines</span>
        </label>

        {selectedWard && (
          <label className="flex items-center gap-2 cursor-pointer text-accent-deep font-medium select-none">
            <input
              type="checkbox"
              checked={filterToWard}
              onChange={(e) => onToggleFilterToWard(e.target.checked)}
              className="rounded border-accent text-accent accent-accent"
            />
            <span>Filter detections strictly to this ward</span>
          </label>
        )}
      </div>
    </div>
  );
}
