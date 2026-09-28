import mongoose from "mongoose";

const droneSchema = new mongoose.Schema(
  {
    droneId: { type: String, required: true, unique: true },
    name: { type: String, required: true, trim: true },
    status: {
      type: String,
      enum: ["Active", "Idle", "Offline", "Maintenance", "IN_MISSION", "IDLE", "ACTIVE", "OFFLINE"],
      default: "Idle",
    },
    latitude: { type: Number, default: null },
    longitude: { type: Number, default: null },
    currentLatitude: { type: Number, default: null },
    currentLongitude: { type: Number, default: null },
    altitude: { type: Number, default: null },
    altitudeMeters: { type: Number, default: null },
    battery: { type: Number, default: null },      // 0–100%
    batteryLevel: { type: Number, default: null },
    speed: { type: Number, default: null },         // km/h
    heading: { type: Number, default: null },       // 0–360°
    lastSeen: { type: Date, default: Date.now },
    lastHeartbeat: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

const Drone = mongoose.model("Drone", droneSchema);
export default Drone;
