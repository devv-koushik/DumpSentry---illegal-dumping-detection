import mongoose from "mongoose";

const ruleSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    contextType: {
      type: String,
      required: true,
      enum: [
        "MEDICAL_FACILITY",
        "EDUCATIONAL_INSTITUTION",
        "ROADSIDE",
        "PUBLIC_AREA",
        "RESIDENTIAL",
        "WATER_BODY",
        "OTHER",
      ],
    },
    radiusMeters: { type: Number, required: true, default: 200 },
    priority: { type: Number, default: 10 },  // lower = higher priority
    enabled: { type: Boolean, default: true },
    authorityType: {
      type: String,
      required: true,
      enum: ["HOSPITAL", "CLINIC", "SCHOOL", "COLLEGE", "UNIVERSITY", "PWD", "MUNICIPAL", "CIVIC", "OTHER"],
    },
    incidentTemplate: {
      type: String,
      default: "SUSPECTED_ILLEGAL_DUMPING",
    },
    reasonTemplate: {
      type: String,
      default: "Garbage detected within {{radius}}m of a {{contextLabel}}.",
    },
  },
  { timestamps: true }
);

ruleSchema.index({ contextType: 1, enabled: 1 });

const Rule = mongoose.model("Rule", ruleSchema);
export default Rule;
