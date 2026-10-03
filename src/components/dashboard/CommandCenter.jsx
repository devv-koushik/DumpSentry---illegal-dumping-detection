import { useState, useCallback, useEffect } from "react";
import { fetchDetections, updateDetectionStatus } from "../../services/api";
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
  const [detections, setDetections] = useState([]);

  // Load live detections from real backend API
  useEffect(() => {
    fetchDetections({ limit: 100 })
      .then((data) => {
        setDetections(Array.isArray(data) ? data : []);
      })
      .catch(() => {
        setDetections([]);
      });
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

  const handleModalAction = useCallback(async (action, id) => {
    let newStatus = null;
    if (action === "resolve") newStatus = "Resolved";
    else if (action === "verify") newStatus = "Suspected Illegal";
    else if (action === "reject") newStatus = "Rejected";

    if (newStatus) {
      setDetections((prev) =>
        prev.map((d) => (d.id === id ? { ...d, status: newStatus } : d))
      );
      try {
        await updateDetectionStatus(id, newStatus);
      } catch (err) {
        console.error("Failed to update detection status in backend:", err);
      }
    }

    setModalDetection(null);
    if (action === "resolve") setSelectedDetection(null);
  }, []);

  const handleAddDetection = useCallback((newDet) => {
    if (!newDet) return;
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
