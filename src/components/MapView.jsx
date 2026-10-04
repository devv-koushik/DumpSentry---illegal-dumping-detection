import { useEffect, useMemo } from "react";
import { MapContainer, TileLayer, CircleMarker, Marker, Polygon, Popup, Tooltip, useMap } from "react-leaflet";
import { Link } from "react-router-dom";
import L from "leaflet";
import { Landmark } from "lucide-react";
import ConfidenceBadge from "./ConfidenceBadge";
import DetectionStatus from "./DetectionStatus";
import { isPointInPolygon } from "../services/wardService";

const STATUS_COLOR = {
  "Suspected Illegal": "#E5484D",
  "Pending Review": "#F5A524",
  Resolved: "#3FB950",
};

/**
 * Controller to smoothly fit map view to the selected ward's boundary or fly to landmark
 */
function MapCameraController({ selectedWard, selectedLandmark, center, zoom }) {
  const map = useMap();

  useEffect(() => {
    if (selectedWard && selectedWard.boundary && selectedWard.boundary.length > 0) {
      try {
        const bounds = L.latLngBounds(selectedWard.boundary);
        map.fitBounds(bounds, {
          padding: [50, 50],
          maxZoom: 16,
          animate: true,
          duration: 1.2,
        });
      } catch (err) {
        console.warn("Could not fit bounds to ward boundary", err);
      }
    } else if (selectedLandmark && selectedLandmark.lat && selectedLandmark.lng) {
      map.flyTo([selectedLandmark.lat, selectedLandmark.lng], 16, {
        animate: true,
        duration: 1.2,
      });
    } else if (center && zoom) {
      map.flyTo(center, zoom, { animate: true, duration: 1.2 });
    }
  }, [selectedWard, selectedLandmark, center, zoom, map]);

  return null;
}

/**
 * Landmark pulse icon
 */
function createLandmarkIcon() {
  return L.divIcon({
    className: "landmark-custom-icon",
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32],
    html: `
      <div style="position: relative; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center;">
        <span style="position: absolute; inset: -4px; border-radius: 50%; background: rgba(226, 163, 59, 0.35); animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></span>
        <div style="width: 30px; height: 30px; border-radius: 50%; background: #10201A; border: 2.5px solid #2FCB8A; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 14px rgba(0,0,0,0.35); color: #2FCB8A;">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <line x1="3" y1="22" x2="21" y2="22"></line>
            <line x1="6" y1="18" x2="6" y2="11"></line>
            <line x1="10" y1="18" x2="10" y2="11"></line>
            <line x1="14" y1="18" x2="14" y2="11"></line>
            <line x1="18" y1="18" x2="18" y2="11"></line>
            <polygon points="12 2 20 7 4 7"></polygon>
          </svg>
        </div>
      </div>
    `,
  });
}

export default function MapView({
  detections = [],
  wards = [],
  selectedWard = null,
  selectedLandmark = null,
  onSelectWard = () => {},
  onSelectLandmark = () => {},
  showAllBoundaries = true,
  filterToWard = false,
  center = [22.56, 88.38],
  zoom = 12,
  height = "100%",
  className = "",
}) {
  // Determine which detections to display
  const visibleDetections = useMemo(() => {
    const valid = (detections || []).filter(
      (d) =>
        d &&
        d.latitude != null &&
        d.longitude != null &&
        !isNaN(Number(d.latitude)) &&
        !isNaN(Number(d.longitude))
    );
    if (!filterToWard || !selectedWard || !selectedWard.boundary) {
      return valid;
    }
    return valid.filter((d) =>
      isPointInPolygon([Number(d.latitude), Number(d.longitude)], selectedWard.boundary)
    );
  }, [detections, filterToWard, selectedWard]);

  return (
    <div
      style={{ height }}
      className={`relative overflow-hidden rounded-card border border-ink/10 shadow-card ${className}`}
    >
      <MapContainer
        center={center}
        zoom={zoom}
        scrollWheelZoom
        style={{ height: "100%", width: "100%" }}
        className="z-0"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <MapCameraController
          selectedWard={selectedWard}
          selectedLandmark={selectedLandmark}
          center={center}
          zoom={zoom}
        />

        {/* ── All Ward Boundaries (when enabled) ── */}
        {showAllBoundaries &&
          wards.map((ward) => {
            const isSelected = selectedWard && selectedWard.id === ward.id;
            if (isSelected) return null; // rendered separately on top
            return (
              <Polygon
                key={ward.id}
                positions={ward.boundary}
                pathOptions={{
                  color: ward.color || "#566A60",
                  weight: 1.5,
                  dashArray: "4, 6",
                  fillColor: ward.color || "#566A60",
                  fillOpacity: 0.06,
                }}
                eventHandlers={{
                  click: () => onSelectWard(ward),
                }}
              >
                <Tooltip sticky direction="top" opacity={0.95}>
                  <div className="font-sans text-xs">
                    <p className="font-bold text-ink">
                      {ward.wardNumber}: {ward.name}
                    </p>
                    <p className="text-[11px] text-muted">
                      {ward.borough} · {ward.zone}
                    </p>
                    <p className="mt-1 font-mono text-[10px] text-accent-deep">
                      Click to highlight boundary & view authorities
                    </p>
                  </div>
                </Tooltip>
              </Polygon>
            );
          })}

        {/* ── HIGHLIGHTED SELECTED WARD BOUNDARY ── */}
        {selectedWard && selectedWard.boundary && (
          <Polygon
            key={`selected-${selectedWard.id}`}
            positions={selectedWard.boundary}
            pathOptions={{
              color: selectedWard.color || "#2FCB8A",
              weight: 4,
              dashArray: null,
              fillColor: selectedWard.color || "#2FCB8A",
              fillOpacity: 0.22,
            }}
          >
            <Popup>
              <div className="min-w-[240px] font-sans p-1">
                <div className="flex items-center justify-between border-b border-line pb-2 mb-2">
                  <div>
                    <span className="inline-block rounded bg-accent/20 px-1.5 py-0.5 text-[10px] font-bold text-ink">
                      {selectedWard.wardNumber}
                    </span>
                    <h4 className="font-bold text-sm text-ink mt-0.5">{selectedWard.name}</h4>
                  </div>
                  <span className="text-[11px] font-medium text-muted">{selectedWard.borough}</span>
                </div>

                <div className="space-y-1.5 text-xs">
                  <div>
                    <p className="text-[10px] text-muted uppercase tracking-wider font-semibold">Ward Councillor</p>
                    <p className="font-medium text-ink">{selectedWard.authorities?.councillor?.name || "Civic Desk"}</p>
                    <p className="text-[11px] text-muted font-mono">{selectedWard.authorities?.councillor?.phone}</p>
                  </div>

                  <div>
                    <p className="text-[10px] text-muted uppercase tracking-wider font-semibold">SWM Executive Engineer</p>
                    <p className="font-medium text-ink">{selectedWard.authorities?.executiveEngineer?.name}</p>
                  </div>

                  <div className="rounded bg-paper p-2 mt-2">
                    <p className="text-[10px] font-semibold text-accent-deep">24/7 Ward Helpline</p>
                    <p className="font-mono text-xs font-bold text-ink">{selectedWard.authorities?.helpline?.controlRoom}</p>
                  </div>
                </div>
              </div>
            </Popup>
          </Polygon>
        )}

        {/* ── Landmarks for Selected Ward or all ── */}
        {selectedWard &&
          selectedWard.landmarks &&
          selectedWard.landmarks.map((lm) => {
            const isTarget = selectedLandmark && selectedLandmark.name === lm.name;
            return (
              <Marker
                key={lm.id || lm.name}
                position={[lm.lat, lm.lng]}
                icon={createLandmarkIcon()}
                eventHandlers={{
                  click: () => onSelectLandmark(lm),
                }}
              >
                <Popup>
                  <div className="min-w-[190px] font-sans">
                    <div className="flex items-center gap-1.5 text-accent-deep">
                      <Landmark size={14} />
                      <span className="text-[10px] uppercase font-bold tracking-wider">{lm.type || "Landmark"}</span>
                    </div>
                    <p className="font-bold text-ink text-sm mt-0.5">{lm.name}</p>
                    <p className="text-xs text-muted mt-1">Located within {selectedWard.wardNumber} ({selectedWard.name})</p>
                    <div className="mt-2 pt-2 border-t border-line text-[11px] text-muted">
                      Responsible Authority: <span className="font-semibold text-ink">{selectedWard.authorities?.councillor?.name}</span>
                    </div>
                  </div>
                </Popup>
                <Tooltip permanent={isTarget} direction="bottom" offset={[0, 4]} opacity={0.95}>
                  <span className="text-[11px] font-semibold text-ink">{lm.name}</span>
                </Tooltip>
              </Marker>
            );
          })}

        {/* ── Selected Landmark if from another ward ── */}
        {selectedLandmark &&
          (!selectedWard || !selectedWard.landmarks?.some((l) => l.name === selectedLandmark.name)) && (
            <Marker
              position={[selectedLandmark.lat, selectedLandmark.lng]}
              icon={createLandmarkIcon()}
            >
              <Popup>
                <div className="min-w-[180px] font-sans">
                  <p className="text-[10px] uppercase font-bold text-accent-deep tracking-wider">Landmark</p>
                  <p className="font-bold text-ink text-sm">{selectedLandmark.name}</p>
                  <p className="text-xs text-muted">{selectedLandmark.wardName || selectedLandmark.type}</p>
                </div>
              </Popup>
            </Marker>
          )}

        {/* ── Detection Markers ── */}
        {visibleDetections.map((d) => (
          <CircleMarker
            key={d.id}
            center={[Number(d.latitude), Number(d.longitude)]}
            radius={9}
            pathOptions={{
              color: "#fff",
              weight: 2,
              fillColor: STATUS_COLOR[d.status] || "#566A60",
              fillOpacity: 0.9,
            }}
          >
            <Popup>
              <div className="min-w-[190px] font-sans">
                <div className="flex items-center justify-between">
                  <p className="font-mono text-xs text-muted">{d.id}</p>
                  <DetectionStatus status={d.status} />
                </div>
                <p className="mt-1 font-semibold text-ink text-sm">{d.wasteType}</p>
                <p className="text-xs text-muted">{d.location}</p>
                <p className="text-[11px] text-muted/80 mt-0.5">Context: {d.context}</p>

                <div className="mt-2 flex items-center justify-between">
                  <ConfidenceBadge value={d.confidence} />
                  <span className="text-[10px] font-mono text-muted">
                    {new Date(d.timestamp).toLocaleDateString()}
                  </span>
                </div>

                <div className="mt-2.5 pt-2 border-t border-line flex items-center justify-between">
                  <span className="text-[11px] font-medium text-ink truncate max-w-[120px]">
                    {d.authority || "Municipal Authority"}
                  </span>
                  <Link
                    to={`/dashboard/detections/${d.id}`}
                    className="text-xs font-semibold text-accent-deep hover:underline"
                  >
                    Details →
                  </Link>
                </div>
              </div>
            </Popup>
          </CircleMarker>
        ))}
      </MapContainer>
    </div>
  );
}
