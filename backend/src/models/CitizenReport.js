import mongoose from "mongoose";

const citizenReportSchema = new mongoose.Schema(
  {
    reportId: { type: String, unique: true },
    problemType: { type: String, required: true },
    context: { type: String },
    location: { type: String, required: true },
    landmark: { type: String },
    description: { type: String, required: true },
    reporterName: { type: String },
    reporterContact: { type: String },
    imagePreview: { type: String },
    status: { type: String, default: "Pending Review" },
    priority: { type: String, default: "Medium" },
    assignedAuthority: { type: String, default: "Pending Assignment" },
  },
  { timestamps: true }
);

const CitizenReport = mongoose.model("CitizenReport", citizenReportSchema);
export default CitizenReport;
