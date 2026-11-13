import fs from "fs";
import CitizenReport from "../models/CitizenReport.js";

function formatReport(reportDoc) {
  const r = reportDoc.toObject ? reportDoc.toObject() : reportDoc;
  return {
    ...r,
    id: String(r.reportId || r._id),
    timestamp: r.createdAt || r.updatedAt || new Date().toISOString(),
  };
}

function generateReportId() {
  return `PUB-${Math.floor(100000 + Math.random() * 900000)}`;
}

function resolveAssignedAuthority(context = "") {
  if (context.includes("Hospital")) return "Hospital Superintendent / Borough Health Officer";
  if (context.includes("School")) return "School Administration / Civic Zone";
  return "Municipal SWM & PWD";
}

export async function getReports(req, res, next) {
  try {
    const reports = await CitizenReport.find().sort({ createdAt: -1 });
    res.json(reports.map(formatReport));
  } catch (err) {
    next(err);
  }
}

export async function createReport(req, res, next) {
  try {
    const body = req.body || {};
    const location = typeof body.location === "string" ? body.location.trim() : "";
    const problemType = typeof body.problemType === "string" ? body.problemType.trim() : "";
    const context = typeof body.context === "string" ? body.context.trim() : "";

    if (!location || !problemType) {
      if (req.file?.path) {
        fs.unlink(req.file.path, () => {});
      }
      return res.status(400).json({ error: "Problem type and location are required to submit a report." });
    }

    let imagePreview = "";
    if (req.file) {
      imagePreview = `/uploads/${req.file.filename}`;
    } else if (
      typeof body.imagePreview === "string" &&
      (body.imagePreview.startsWith("/uploads/") ||
        body.imagePreview.startsWith("http://") ||
        body.imagePreview.startsWith("https://") ||
        body.imagePreview.startsWith("data:image/"))
    ) {
      imagePreview = body.imagePreview;
    }

    const baseReportData = {
      problemType,
      context,
      location,
      landmark: typeof body.landmark === "string" ? body.landmark.trim() : "",
      description: typeof body.description === "string" ? body.description.trim() : "",
      reporterName: typeof body.reporterName === "string" ? body.reporterName.trim() : "",
      reporterContact: typeof body.reporterContact === "string" ? body.reporterContact.trim() : "",
      imagePreview,
      status: "Pending Review",
      priority:
        body.priority ||
        (problemType.includes("Biomedical") || context.includes("Hospital") ? "Urgent" : "High"),
      assignedAuthority:
        (typeof body.assignedAuthority === "string" && body.assignedAuthority.trim()) ||
        resolveAssignedAuthority(context),
    };

    let newReport = null;
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        newReport = await CitizenReport.create({
          ...baseReportData,
          reportId: generateReportId(),
        });
        break;
      } catch (err) {
        if (err.code === 11000 && err.keyPattern?.reportId && attempt < 2) {
          continue;
        }
        throw err;
      }
    }

    res.status(201).json(formatReport(newReport));
  } catch (err) {
    if (req.file?.path) {
      fs.unlink(req.file.path, () => {});
    }
    next(err);
  }
}

export async function updateReportStatus(req, res, next) {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const query = id.startsWith("PUB-") ? { reportId: id } : { _id: id };

    const report = await CitizenReport.findOneAndUpdate(
      query,
      { status },
      { new: true }
    );

    if (!report) return res.status(404).json({ error: "Report not found" });
    res.json(formatReport(report));
  } catch (err) {
    next(err);
  }
}

export async function deleteReport(req, res, next) {
  try {
    const { id } = req.params;
    const query = id.startsWith("PUB-") ? { reportId: id } : { _id: id };
    const report = await CitizenReport.findOneAndDelete(query);
    if (!report) return res.status(404).json({ error: "Report not found" });
    res.json({ message: "Report deleted successfully" });
  } catch (err) {
    next(err);
  }
}
