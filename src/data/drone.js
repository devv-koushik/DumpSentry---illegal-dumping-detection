// Mock drone telemetry. In production this would come from a WebSocket
// or polling endpoint connected to the actual drone controller.

export const DRONE = {
  id: "DRONE-01",
  latitude: 22.5726,
  longitude: 88.4003,
  altitude: 84,
  battery: 76,
  speed: 12.4,
  status: "Active",
  heading: 142,
  uptime: "2h 14m",
  lastPing: new Date().toISOString(),
};

// Simulated flight path the drone has taken (recent waypoints)
export const FLIGHT_PATH = [
  [22.5851, 88.4203],
  [22.5820, 88.4180],
  [22.5800, 88.4150],
  [22.5785, 88.4120],
  [22.5770, 88.4090],
  [22.5755, 88.4060],
  [22.5740, 88.4030],
  [22.5726, 88.4003],
];

// Nearby facilities shown on the map
export const FACILITIES = [
  { id: "F-01", type: "Hospital", name: "City General Hospital", lat: 22.5354, lng: 88.3616 },
  { id: "F-02", type: "School", name: "New Town High School", lat: 22.6198, lng: 88.4331 },
  { id: "F-03", type: "School", name: "Kasba Golpark School", lat: 22.5312, lng: 88.4287 },
  { id: "F-04", type: "Hospital", name: "Alipore Medical Centre", lat: 22.5445, lng: 88.3536 },
  { id: "F-05", type: "College", name: "Jadavpur University", lat: 22.4993, lng: 88.3714 },
  { id: "F-06", type: "Hospital", name: "Ruby General Hospital", lat: 22.5675, lng: 88.4108 },
];
