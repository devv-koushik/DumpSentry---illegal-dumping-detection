import Detection from "../models/Detection.js";
import AuditLog from "../models/AuditLog.js";

/**
 * Format detection document to support both frontend expected format and full schema.
 */
export function formatDetection(doc) {
  if (!doc) return null;
  const d = doc.toObject ? doc.toObject() : doc;
  return {
    ...d,
    id: d.detectionId || d._id.toString(),
    _id: d._id.toString(),
    image: d.annotatedImageUrl || d.originalImageUrl,
    wasteType: Array.isArray(d.wasteTypes) && d.wasteTypes.length > 0
      ? d.wasteTypes.join(", ")
      : "No Waste Detected",
    confidence: Math.round(
      (d.overallConfidence || 0) > 1
        ? d.overallConfidence
        : (d.overallConfidence || 0) * 100
    ),
    authority: d.authorityName || "Pending Assignment",
  };
}

/**
 * Helper to escape regex special characters
 */
function escapeRegex(string) {
  return String(string).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * GET /api/detections
 * Supports query params: status, context, search, page, limit
 */
export async function getDetections(req, res, next) {
  try {
    const { status, context, search, page = "1", limit = "50" } = req.query;
    const filter = {};

    // Prevent NoSQL object injection by forcing string types
    if (status && typeof status === "string" && status !== "All") {
      filter.status = status;
    }
    if (context && typeof context === "string" && context !== "All") {
      filter.context = { $regex: escapeRegex(context), $options: "i" };
    }
    if (search && typeof search === "string") {
      const safeSearch = escapeRegex(search);
      filter.$or = [
        { detectionId: { $regex: safeSearch, $options: "i" } },
        { location: { $regex: safeSearch, $options: "i" } },
        { wasteTypes: { $regex: safeSearch, $options: "i" } },
        { context: { $regex: safeSearch, $options: "i" } },
        { authorityName: { $regex: safeSearch, $options: "i" } },
      ];
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 50));
    
    const total = await Detection.countDocuments(filter);

    const detections = await Detection.find(filter)
      .sort({ timestamp: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum);

    res.json({
      total,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum),
      data: detections.map(formatDetection),
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/detections/map
 * Lightweight endpoint returning coordinates and basic info for map display
 */
export async function getMapDetections(req, res, next) {
  try {
    const detections = await Detection.find(
      {},
      "detectionId latitude longitude status wasteTypes context overallConfidence originalImageUrl annotatedImageUrl location timestamp authorityName"
    )
      .sort({ timestamp: -1 })
      .limit(200);

    res.json(detections.map(formatDetection));
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/detections/:id
 */
export async function getDetectionById(req, res, next) {
  try {
    const { id } = req.params;
    let detection = null;

    if (id.match(/^[0-9a-fA-F]{24}$/)) {
      detection = await Detection.findById(id).populate("authorityId");
    }
    if (!detection) {
      detection = await Detection.findOne({ detectionId: id }).populate("authorityId");
    }

    if (!detection) {
      return res.status(404).json({ error: "Detection not found" });
    }

    res.json(formatDetection(detection));
  } catch (err) {
    next(err);
  }
}

/**
 * PATCH /api/detections/:id/status
 * Update status (e.g. "Suspected Illegal", "Verified", "Rejected", "Resolved")
 */
export async function updateDetectionStatus(req, res, next) {
  try {
    const { id } = req.params;
    const { status, alertStatus } = req.body;

    const query = id.match(/^[0-9a-fA-F]{24}$/) ? { _id: id } : { detectionId: id };
    const detection = await Detection.findOne(query);

    if (!detection) {
      return res.status(404).json({ error: "Detection not found" });
    }

    if (status) detection.status = status;
    if (alertStatus) detection.alertStatus = alertStatus;

    await detection.save();

    // Log admin action if req.user exists
    if (req.user) {
      await AuditLog.create({
        userId: req.user._id,
        userEmail: req.user.email,
        action: "UPDATE_DETECTION_STATUS",
        targetId: detection._id.toString(),
        details: { newStatus: status, newAlertStatus: alertStatus },
      }).catch(() => {});
    }

    res.json(formatDetection(detection));
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/detections/:id/verify
 * Admin marks detection as Verified or Rejected
 */
export async function verifyDetection(req, res, next) {
  try {
    const { id } = req.params;
    const { verified, notes } = req.body;

    const query = id.match(/^[0-9a-fA-F]{24}$/) ? { _id: id } : { detectionId: id };
    const detection = await Detection.findOne(query);

    if (!detection) {
      return res.status(404).json({ error: "Detection not found" });
    }

    detection.status = verified ? "Verified" : "Rejected";
    detection.verifiedBy = req.user?.id || null;
    detection.verifiedAt = new Date();
    detection.verificationNotes = notes || "";

    await detection.save();

    res.json({
      message: `Detection marked as ${detection.status}`,
      detection: formatDetection(detection),
    });
  } catch (err) {
    next(err);
  }
}

/**
 * DELETE /api/detections/:id
 */
export async function deleteDetection(req, res, next) {
  try {
    const { id } = req.params;
    const query = id.match(/^[0-9a-fA-F]{24}$/) ? { _id: id } : { detectionId: id };
    const result = await Detection.findOneAndDelete(query);

    if (!result) {
      return res.status(404).json({ error: "Detection not found" });
    }

    res.json({ message: "Detection deleted successfully" });
  } catch (err) {
    next(err);
  }
}
