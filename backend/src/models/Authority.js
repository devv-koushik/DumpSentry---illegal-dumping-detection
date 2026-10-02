import mongoose from "mongoose";

const authoritySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    type: {
      type: String,
      required: true,
      enum: ["HOSPITAL", "CLINIC", "SCHOOL", "COLLEGE", "UNIVERSITY", "PWD", "MUNICIPAL", "CIVIC", "WARD", "OTHER"],
      default: "WARD",
    },
    email: { type: String, required: true, trim: true, lowercase: true },
    phone: { type: String, default: "" },
    location: { type: String, default: "" },
    active: { type: Boolean, default: true },

    // ─── Ward-by-Ward Extensions ───
    wardNumber: { type: String, default: "" },
    borough: { type: String, default: "" },
    zone: { type: String, default: "" },
    color: { type: String, default: "#e2a33b" },
    center: { type: [Number], default: [22.56, 88.38] },
    boundary: { type: [[Number]], default: [] },
    authorities: {
      councillor: { type: mongoose.Schema.Types.Mixed, default: {} },
      executiveEngineer: { type: mongoose.Schema.Types.Mixed, default: {} },
      sanitaryInspector: { type: mongoose.Schema.Types.Mixed, default: {} },
      office: { type: mongoose.Schema.Types.Mixed, default: {} },
      helpline: { type: mongoose.Schema.Types.Mixed, default: {} },
      depot: { type: mongoose.Schema.Types.Mixed, default: {} },
      policeLiaison: { type: mongoose.Schema.Types.Mixed, default: {} },
    },
    landmarks: { type: [mongoose.Schema.Types.Mixed], default: [] },
    stats: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

const Authority = mongoose.model("Authority", authoritySchema);
export default Authority;
