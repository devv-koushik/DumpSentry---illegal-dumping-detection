import mongoose from "mongoose";

const boundingBoxSchema = new mongoose.Schema(
  {
    class: { type: String, required: true },
    confidence: { type: Number, required: true },
    bbox: {
      x: Number,
      y: Number,
      width: Number,
      height: Number,
    },
  },
  { _id: false }
);

const nearbyPlaceSchema = new mongoose.Schema(
  {
    name: String,
    type: String,            // e.g. "hospital", "school"
    contextType: String,     // e.g. "MEDICAL_FACILITY"
    distance: Number,        // meters from dump site
    osmId: String,
    latitude: Number,
    longitude: Number,
  },
  { _id: false }
);

const detectionSchema = new mongoose.Schema(
  {
    // Human-readable ID (auto-generated)
    detectionId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    // ─── Images ───
    originalImageUrl: { type: String, required: true },
    annotatedImageUrl: { type: String, default: null },

    // ─── Drone reference ───
    droneId: { type: String, default: null },

    // ─── Location ───
    latitude: { type: Number, default: null },
    longitude: { type: Number, default: null },
    location: { type: String, default: "Location Unavailable" }, // reverse-geocoded address or unavailable
    gpsAvailable: { type: Boolean, default: false },

    // ─── Timestamp ───
    timestamp: { type: Date, default: Date.now },

    // ─── AI detections ───
    detections: [boundingBoxSchema],
    wasteTypes: [String],              // unique classes found
    overallConfidence: { type: Number, default: 0 },

    // ─── Geospatial context ───
    context: { type: String, default: "" },          // primary context (human-readable)
    contextType: { type: String, default: "OTHER" }, // e.g. "MEDICAL_FACILITY"
    nearbyPlaces: [nearbyPlaceSchema],
    allContexts: [String],             // all matched context types

    // ─── Incident classification ───
    incidentType: { type: String, default: "" },
    suspicionReason: { type: String, default: "" },

    // ─── Authority ───
    authorityId: { type: mongoose.Schema.Types.ObjectId, ref: "Authority", default: null },
    authorityName: { type: String, default: "" },

    // ─── Status ───
    status: {
      type: String,
      enum: ["Pending Review", "Suspected Illegal", "Verified", "Rejected", "Resolved"],
      default: "Pending Review",
    },
    alertStatus: {
      type: String,
      enum: ["Not Sent", "Sent", "Failed", "Resolved"],
      default: "Not Sent",
    },

    // ─── Verification ───
    verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    verifiedAt: { type: Date, default: null },
    verificationNotes: { type: String, default: "" },
  },
  { timestamps: true }
);

// Geospatial index for map queries
detectionSchema.index({ latitude: 1, longitude: 1 });
detectionSchema.index({ status: 1 });
detectionSchema.index({ timestamp: -1 });

const Detection = mongoose.model("Detection", detectionSchema);
export default Detection;
