import { useState, useCallback, useEffect } from "react";
import { DETECTIONS as INITIAL_DETECTIONS } from "../../data/detections";
import { fetchDetections } from "../../services/mockDetections";
import TopBar from "./TopBar";
import CenterMap from "./CenterMap";
import FloatingStats from "./FloatingStats";
import AIAnalysisPanel from "./AIAnalysisPanel";
import LiveDetectionFeed from "./LiveDetectionFeed";
import AICommandBar from "./AICommandBar";
import MapFilters from "./MapFilters";
import IncidentModal from "./IncidentModal";
import UploadModal from "./UploadModal";

export default function CommandCenter() {
  const [detections, setDetections] = useState(INITIAL_DETECTIONS);

  // Load live detections from API (falls back to mock if offline)
  useEffect(() => {
    fetchDetections({ limit: 100 }).then((data) => {
      if (Array.isArray(data) && data.length > 0) {
        setDetections(data);
      }
    }).catch(() => {});
  }, []);
  const [selectedDetection, setSelectedDetection] = useState(null);
  const [modalDetection, setModalDetection] = useState(null);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [filters, setFilters] = useState({
    status: "All",
    context: "All",
    wasteType: "All",
  });

  const handleSelectDetection = useCallback((detection) => {
    setSelectedDetection(detection);
  }, []);

  const handlePanelAction = useCallback(
    (action, id) => {
      if (action === "review") {
        const det = detections.find((d) => d.id === id);
        if (det) setModalDetection(det);
      }
    },
    [detections]
  );

  const handleModalAction = useCallback((action, id) => {
    if (action === "resolve") {
      setDetections((prev) =>
        prev.map((d) => (d.id === id ? { ...d, status: "Resolved" } : d))
      );
      setModalDetection(null);
      setSelectedDetection(null);
    } else if (action === "verify") {
      setDetections((prev) =>
        prev.map((d) => (d.id === id ? { ...d, status: "Suspected Illegal" } : d))
      );
      setModalDetection(null);
    } else if (action === "reject") {
      setDetections((prev) =>
        prev.map((d) => (d.id === id ? { ...d, status: "Rejected" } : d))
      );
      setModalDetection(null);
    }
  }, []);

  const handleAddDetection = useCallback((newDet) => {
    setDetections((prev) => [newDet, ...prev]);
    setSelectedDetection(newDet);
    setIsUploadOpen(false);
  }, []);

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-paper font-cmd">
      {/* Central Map — base layer, z-0 */}
      <CenterMap
        detections={detections}
        selectedDetection={selectedDetection}
        onSelectDetection={handleSelectDetection}
        filters={filters}
      />

      {/* ── All UI overlays sit above the map ── */}
      <div className="pointer-events-none absolute inset-0" style={{ zIndex: 1000 }}>
        {/* Subtle warm atmospheric gradient matching landing theme */}
        <div
          className="absolute inset-0"
          style={{
            background: `
              radial-gradient(ellipse 80% 60% at 50% 40%, rgba(226,163,59,0.03) 0%, transparent 70%)
            `,
          }}
        />

        {/* Top Bar */}
        <div className="pointer-events-auto">
          <TopBar onOpenUpload={() => setIsUploadOpen(true)} />
        </div>

        {/* Floating Stats */}
        <div className="pointer-events-auto">
          <FloatingStats />
        </div>

        {/* Map Filters */}
        <div className="pointer-events-auto">
          <MapFilters filters={filters} onFilterChange={setFilters} />
        </div>

        {/* Live Detection Feed */}
        <div className="pointer-events-auto">
          <LiveDetectionFeed
            detections={detections}
            selectedId={selectedDetection?.id}
            onSelect={handleSelectDetection}
          />
        </div>

        {/* AI Analysis Panel (right side) */}
        <div className="pointer-events-auto">
          <AIAnalysisPanel
            detection={selectedDetection}
            onClose={() => setSelectedDetection(null)}
            onAction={handlePanelAction}
          />
        </div>

        {/* AI Command Bar (bottom center) */}
        <div className="pointer-events-auto">
          <AICommandBar />
        </div>
      </div>

      {/* Incident Review Modal */}
      {modalDetection && (
        <IncidentModal
          detection={modalDetection}
          onClose={() => setModalDetection(null)}
          onAction={handleModalAction}
        />
      )}

      {/* Drone Capture Upload Modal */}
      <UploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onAddDetection={handleAddDetection}
      />
    </div>
  );
}
