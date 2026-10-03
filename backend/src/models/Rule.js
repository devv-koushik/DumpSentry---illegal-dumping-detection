import mongoose from "mongoose";
import { AUTHORITY_TYPES } from "../config/constants.js";

const ruleSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    contextType: {
      type: String,
      required: true,
      enum: [
        "HEALTHCARE",
        "ROADSIDE",
        "EDUCATIONAL",
        "WATER_BODY",
        "ENVIRONMENTAL_PROTECTED",
        "INDUSTRIAL",
        "RESIDENTIAL",
        "COMMERCIAL",
        "TRANSPORT",
        "PUBLIC_AREA",
        "AGRICULTURAL",
        "OTHER_UNKNOWN",
        // Backward-compatibility aliases
        "MEDICAL_FACILITY",
        "EDUCATIONAL_INSTITUTION",
        "OTHER",
      ],
    },
    radiusMeters: { type: Number, required: true, default: 200 },
    priority: { type: Number, default: 10 },  // lower = higher priority
    enabled: { type: Boolean, default: true },
    authorityType: {
      type: String,
      required: true,
      enum: AUTHORITY_TYPES,
      default: "MUNICIPAL",
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
