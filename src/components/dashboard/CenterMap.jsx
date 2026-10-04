import { useEffect, useMemo } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from "react-leaflet";
import L from "leaflet";
import { DRONE, FLIGHT_PATH } from "../../data/drone";
import { findWardForCoordinates } from "../../services/wardService";

// ── Custom marker icons ──

function createDivIcon(color, size = 12, pulse = false) {
  const pulseRing = pulse
    ? `<span style="position:absolute;inset:-4px;border-radius:50%;border:2px solid ${color};opacity:0.4;animation:dronePulseCSS 2s ease-in-out infinite"></span>`
    : "";
  return L.divIcon({
    className: "",
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2 - 4],
    html: `<div style="position:relative;width:${size}px;height:${size}px">
      ${pulseRing}
      <span style="display:block;width:${size}px;height:${size}px;border-radius:50%;background:${color};box-shadow:0 0 8px ${color}44;border:2px solid ${color}33"></span>
    </div>`,
  });
}

const MARKER_ICONS = {
  "Suspected Illegal": createDivIcon("#E5484D", 12),
  "Pending Review": createDivIcon("#F5A524", 12),
  Resolved: createDivIcon("#3FB950", 10),
};

const DRONE_ICON = createDivIcon("#38BDF8", 14, true);

// ── Fly to selected detection ──
function FlyToDetection({ detection }) {
  const map = useMap();
  useEffect(() => {
    if (
      detection &&
      detection.latitude != null &&
      detection.longitude != null &&
      !isNaN(detection.latitude) &&
      !isNaN(detection.longitude)
    ) {
      map.flyTo([detection.latitude, detection.longitude], 14, { duration: 1.2 });
    }
  }, [detection, map]);
  return null;
}

export default function CenterMap({ detections, selectedDetection, onSelectDetection, filters }) {
  const filteredDetections = useMemo(() => {
    let result = detections;
    if (filters.status && filters.status !== "All") {
      result = result.filter((d) => d.status === filters.status);
    }
    if (filters.context && filters.context !== "All") {
      result = result.filter((d) => d.context === filters.context);
    }
    if (filters.wasteType && filters.wasteType !== "All") {
      result = result.filter((d) => d.wasteType === filters.wasteType);
    }
    return result;
  }, [detections, filters]);

  // Valid detections that have real GPS coordinates for Leaflet marker rendering
  const mappedDetections = useMemo(() => {
    return filteredDetections.filter(
      (d) =>
        d.latitude != null &&
        d.longitude != null &&
        !isNaN(Number(d.latitude)) &&
        !isNaN(Number(d.longitude))
    );
  }, [filteredDetections]);

  const center = [22.5600, 88.3900];

  return (
    <div className="absolute inset-0 z-0">
      <MapContainer
        center={center}
        zoom={12}
        className="h-full w-full"
        zoomControl={false}
        attributionControl={false}
        style={{ background: "#eff2ea" }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        />

        <FlyToDetection detection={selectedDetection} />

        {/* Detection markers (only valid coordinates) */}
        {mappedDetections.map((d) => (
          <Marker
            key={d.id}
            position={[Number(d.latitude), Number(d.longitude)]}
            icon={MARKER_ICONS[d.status] || MARKER_ICONS["Pending Review"]}
            eventHandlers={{ click: () => onSelectDetection(d) }}
          >
            <Popup className="cmd-popup" closeButton={false} autoPan={false}>
              <div className="font-cmd p-0.5">
                <div className="flex items-center justify-between gap-3 mb-1.5">
                  <span className="font-mono text-[11px] font-semibold text-accent">{d.id}</span>
                  <span className="text-[9px] font-mono text-cmd-muted">{d.confidence}%</span>
                </div>
                <p className="text-[10px] font-medium text-cmd-text">{d.wasteType}</p>
                <p className="text-[9px] text-cmd-muted">
                  {d.context || "Unclassified"} · {(d.location || "Unknown Location").split(",")[0]}
                </p>
                {(() => {
                  const ward =
                    d.latitude != null && d.longitude != null
                      ? findWardForCoordinates(Number(d.latitude), Number(d.longitude))
                      : null;
                  return ward ? (
                    <p className="mt-1 text-[9px] font-mono text-accent truncate">
                      {ward.wardNumber}: {ward.name}
                    </p>
                  ) : null;
                })()}
                <p
                  className={`mt-1 text-[9px] font-semibold ${
                    d.status === "Suspected Illegal"
                      ? "text-danger"
                      : d.status === "Resolved"
                      ? "text-success"
                      : "text-warning"
                  }`}
                >
                  {d.status}
                </p>
              </div>
            </Popup>
          </Marker>
        ))}

        {/* Drone flight path */}
        <Polyline
          positions={FLIGHT_PATH}
          pathOptions={{
            color: "#38BDF8",
            weight: 2,
            opacity: 0.4,
            dashArray: "6, 8",
          }}
        />

        {/* Drone marker */}
        <Marker position={[DRONE.latitude, DRONE.longitude]} icon={DRONE_ICON}>
          <Popup className="cmd-popup" closeButton={false}>
            <div className="font-cmd p-0.5">
              <div className="flex items-center gap-1.5 mb-1">
                <span className="h-1.5 w-1.5 rounded-full bg-cmd-info animate-pulse" />
                <span className="text-[10px] font-semibold text-cmd-text">{DRONE.id}</span>
              </div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-0.5 text-[9px]">
                <span className="text-cmd-muted">Altitude</span>
                <span className="text-cmd-text font-mono">{DRONE.altitude}m</span>
                <span className="text-cmd-muted">Battery</span>
                <span className="text-cmd-text font-mono">{DRONE.battery}%</span>
                <span className="text-cmd-muted">Speed</span>
                <span className="text-cmd-text font-mono">{DRONE.speed} km/h</span>
                <span className="text-cmd-muted">Status</span>
                <span className="text-success font-medium">{DRONE.status}</span>
              </div>
            </div>
          </Popup>
        </Marker>
      </MapContainer>

      {/* Map overlay gradient at edges — soft cream fade */}
      <div
        className="pointer-events-none absolute inset-0 z-[1]"
        style={{
          background: `
            radial-gradient(ellipse at center, transparent 60%, rgba(239,242,234,0.4) 100%),
            linear-gradient(to bottom, rgba(239,242,234,0.85) 0%, transparent 6%),
            linear-gradient(to top, rgba(239,242,234,0.9) 0%, transparent 12%)
          `,
        }}
      />
    </div>
  );
}
