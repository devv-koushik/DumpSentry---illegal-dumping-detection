import mongoose from "mongoose";

const landmarkSchema = new mongoose.Schema(
  {
    id: String,
    name: String,
    lat: Number,
    lng: Number,
    type: String,
  },
  { _id: false }
);

const wardSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true },
    wardNumber: String,
    name: String,
    borough: String,
    zone: String,
    color: String,
    center: [Number],
    zoom: Number,
    boundary: [[Number]],
    authorities: mongoose.Schema.Types.Mixed,
    landmarks: [landmarkSchema],
    stats: mongoose.Schema.Types.Mixed,
  },
  { timestamps: true }
);

export default mongoose.model("Ward", wardSchema);
