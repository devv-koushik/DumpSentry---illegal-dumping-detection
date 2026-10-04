import CitizenReport from "../models/CitizenReport.js";
import { randomUUID } from "crypto";

export async function getReports(req, res, next) {
  try {
    const reports = await CitizenReport.find().sort({ createdAt: -1 });
    res.json(reports.map(r => ({ ...r.toObject(), id: r.reportId || r._id })));
  } catch (err) {
    next(err);
  }
}

export async function createReport(req, res, next) {
  try {
    const reportData = req.body;
    reportData.reportId = `PUB-${Math.floor(1000 + Math.random() * 9000)}`;
    const newReport = await CitizenReport.create(reportData);
    res.status(201).json({ ...newReport.toObject(), id: newReport.reportId });
  } catch (err) {
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
    res.json({ ...report.toObject(), id: report.reportId });
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
