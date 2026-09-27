import { MapContainer, TileLayer, CircleMarker, Popup } from "react-leaflet";
import { Link } from "react-router-dom";
import ConfidenceBadge from "./ConfidenceBadge";
import DetectionStatus from "./DetectionStatus";

const STATUS_COLOR = {
  "Suspected Illegal": "#c94b3f",
  "Pending Review": "#e2a33b",
  Resolved: "#3f8a5c",
};

export default function MapView({ detections, center = [22.57, 88.39], zoom = 11, height = "100%" }) {
  return (
    <div style={{ height }} className="overflow-hidden rounded-card border border-ink/10">
      <MapContainer center={center} zoom={zoom} scrollWheelZoom style={{ height: "100%", width: "100%" }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {detections.map((d) => (
          <CircleMarker
            key={d.id}
            center={[d.latitude, d.longitude]}
            radius={9}
            pathOptions={{
              color: "#fff",
              weight: 2,
              fillColor: STATUS_COLOR[d.status] || "#5c665d",
              fillOpacity: 0.9,
            }}
          >
            <Popup>
              <div className="min-w-[180px] font-sans">
                <p className="font-mono text-xs text-muted">{d.id}</p>
                <p className="mt-1 font-medium text-ink">{d.wasteType}</p>
                <p className="text-xs text-muted">{d.location}</p>
                <div className="mt-2 flex items-center justify-between">
                  <ConfidenceBadge value={d.confidence} />
                  <DetectionStatus status={d.status} />
                </div>
                <Link
                  to={`/dashboard/detections/${d.id}`}
                  className="mt-3 inline-block text-xs font-medium text-accent-deep hover:underline"
                >
                  View details →
                </Link>
              </div>
            </Popup>
          </CircleMarker>
        ))}
      </MapContainer>
    </div>
  );
}
