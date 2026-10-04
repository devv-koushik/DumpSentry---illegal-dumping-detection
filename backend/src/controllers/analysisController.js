import fs from "fs";
import path from "path";
import Detection from "../models/Detection.js";
import { runInference } from "../services/aiClient.js";
import { detectEnvironmentalContext } from "../services/geospatial.js";
import { evaluateRules } from "../services/ruleEngine.js";
import { formatDetection } from "./detectionController.js";
import { dispatchAlertForDetection } from "./alertController.js";

/**
 * Helper to generate human-readable detection ID: DS-YYYYMMDD-XXXX
 */
function generateDetectionId() {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  return `DS-${dateStr}-${randomSuffix}`;
}

/**
 * POST /api/analysis/analyze
 * Body: { latitude, longitude, droneId }
 * File: req.file (from multer)
 */
export async function analyzeImage(req, res, next) {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "Image file is required" });
    }

    // Check if GPS coordinates are explicitly supplied in the request
    const hasLat =
      req.body.latitude !== undefined &&
      req.body.latitude !== null &&
      String(req.body.latitude).trim() !== "";
    const hasLon =
      req.body.longitude !== undefined &&
      req.body.longitude !== null &&
      String(req.body.longitude).trim() !== "";

    let lat = null;
    let lon = null;
    let gpsAvailable = false;

    if (hasLat && hasLon) {
      const parsedLat = parseFloat(req.body.latitude);
      const parsedLon = parseFloat(req.body.longitude);
      if (
        !isNaN(parsedLat) &&
        !isNaN(parsedLon) &&
        parsedLat >= -90 &&
        parsedLat <= 90 &&
        parsedLon >= -180 &&
        parsedLon <= 180
      ) {
        lat = parsedLat;
        lon = parsedLon;
        gpsAvailable = true;
      }
    }

    // Drone ID: use provided droneId or flag as manual upload (do not pretend missing GPS is from a drone)
    const droneId = req.body.droneId
      ? String(req.body.droneId).trim()
      : gpsAvailable
      ? "DRONE-01"
      : "MANUAL-UPLOAD";

    const originalFilePath = req.file.path;
    const fileUrl = `/uploads/${path.basename(originalFilePath)}`;

    // 1. Run AI Inference (Python FastAPI YOLO service)
    let aiResult;
    try {
      const conf = req.body.confidence ? parseFloat(req.body.confidence) : 0.25;
      aiResult = await runInference(originalFilePath, conf);
    } catch (aiErr) {
      console.error("[AnalysisController] AI Service inference failed:", aiErr.message);
      return res.status(502).json({
        success: false,
        error: "AI inference service failed to process image",
        details: aiErr.message,
      });
    }

    // Save annotated image if AI service returned base64
    let annotatedImageUrl = null;
    if (aiResult.annotatedImageBase64) {
      const annotatedFilename = `annotated-${Date.now()}-${path.basename(originalFilePath)}`;
      const annotatedPath = path.join(path.dirname(originalFilePath), annotatedFilename);
      const buffer = Buffer.from(aiResult.annotatedImageBase64, "base64");
      fs.writeFileSync(annotatedPath, buffer);
      annotatedImageUrl = `/uploads/${annotatedFilename}`;
    }

    // Extract unique waste types and highest confidence
    const detectedClasses = [...new Set(aiResult.detections.map((d) => d.class))];
    const maxConfidence =
      aiResult.detections.length > 0
        ? Math.max(...aiResult.detections.map((d) => d.confidence))
        : 0;

    // 2. Geospatial Context Detection (independent of YOLO)
    let geoContext = {
      contextType: "OTHER_UNKNOWN",
      contextLabel: "Unclassified Area",
      nearbyPlaceName: null,
      distance: null,
      source: "none",
      coordinates: null,
      locationName: "Location Unavailable (No GPS coordinates provided)",
      nearbyPlaces: [],
      allMatchedContexts: [],
    };

    let ruleEvaluation = {
      allContexts: [],
      primaryContext: "OTHER_UNKNOWN",
      primaryContextLabel: "Unclassified Area",
      incidentType: "SUSPECTED_ILLEGAL_DUMPING",
      suspicionReason: "Garbage detected without GPS coordinates. Routed for manual review.",
      nearestPlace: null,
      authority: null,
      matchedRule: null,
    };

    if (gpsAvailable) {
      try {
        geoContext = await detectEnvironmentalContext(lat, lon, 300);
        ruleEvaluation = await evaluateRules(
          geoContext.nearbyPlaces,
          geoContext.contextType,
          geoContext
        );
      } catch (geoErr) {
        console.warn("[AnalysisController] Geospatial lookup warning:", geoErr.message);
        geoContext.locationName = `Coordinates: ${lat}, ${lon}`;
        ruleEvaluation = await evaluateRules([], "OTHER_UNKNOWN", geoContext);
      }
    } else {
      ruleEvaluation = await evaluateRules([], "OTHER_UNKNOWN", geoContext);
    }

    // 3. Determine initial status: Suspected Illegal vs Pending Review
    let initialStatus = "Pending Review";
    if (
      geoContext.contextType !== "OTHER_UNKNOWN" &&
      geoContext.contextType !== "OTHER" &&
      detectedClasses.length > 0
    ) {
      initialStatus = "Suspected Illegal";
    }

    // 4. Save Detection record to MongoDB (Notification eligible, no auto-dispatch)
    const detectionId = generateDetectionId();
    const newDetection = new Detection({
      detectionId,
      originalImageUrl: fileUrl,
      annotatedImageUrl: annotatedImageUrl || fileUrl,
      droneId,
      latitude: lat,
      longitude: lon,
      location: geoContext.locationName,
      gpsAvailable,
      timestamp: new Date(),
      detections: aiResult.detections,
      wasteTypes: detectedClasses,
      overallConfidence: maxConfidence,
      context: geoContext.contextLabel || ruleEvaluation.primaryContextLabel || "General Area",
      contextType: ruleEvaluation.primaryContext || geoContext.contextType || "OTHER_UNKNOWN",
      nearbyPlaces: geoContext.nearbyPlaces,
      allContexts: geoContext.allMatchedContexts?.length > 0 ? geoContext.allMatchedContexts : ruleEvaluation.allContexts,
      incidentType: ruleEvaluation.incidentType,
      suspicionReason: ruleEvaluation.suspicionReason,
      authorityId: ruleEvaluation.authority?._id || null,
      authorityName: ruleEvaluation.authority?.name || "City Municipal Corporation",
      status: initialStatus,
      alertStatus: "Not Sent",
    });

    await newDetection.save();

    // 5. Automatic Notification & Email Dispatch Flow:
    // Real YOLO detection -> context detection -> rule evaluation -> authority mapping -> incident creation -> notification -> email
    let notificationResult = null;
    if (aiResult.wasteDetected && aiResult.detections.length > 0) {
      try {
        notificationResult = await dispatchAlertForDetection({
          detection: newDetection,
          authority: ruleEvaluation.authority,
        });
      } catch (notifErr) {
        console.error("[AnalysisController] Automatic notification dispatch error:", notifErr.message);
        notificationResult = {
          success: false,
          status: "failed",
          emailStatus: "failed",
          error: notifErr.message,
          detectionPreserved: true,
        };
      }
    }

    const formatted = formatDetection(newDetection);

    res.status(201).json({
      success: true,
      detection: formatted,
      ai: {
        wasteDetected: aiResult.wasteDetected,
        totalDetections: aiResult.totalDetections,
        detectionsCount: aiResult.detections.length,
        classes: detectedClasses,
        maxConfidence,
        detections: aiResult.detections,
      },
      geospatial: {
        gpsAvailable,
        latitude: lat,
        longitude: lon,
        location: geoContext.locationName,
        contextType: geoContext.contextType,
        contextLabel: geoContext.contextLabel,
        nearbyPlaceName: geoContext.nearbyPlaceName,
        distance: geoContext.distance,
        source: geoContext.source,
        coordinates: geoContext.coordinates,
        nearbyPlacesCount: geoContext.nearbyPlaces.length,
        allMatchedContexts: geoContext.allMatchedContexts,
        nearestPlace: geoContext.nearbyPlaces[0] || null,
      },
      ruleEngine: {
        matchedRule: ruleEvaluation.matchedRule?.name || "Default Rule",
        primaryContext: ruleEvaluation.primaryContext,
        incidentType: ruleEvaluation.incidentType,
        suspicionReason: ruleEvaluation.suspicionReason,
        authority: ruleEvaluation.authority,
      },
      notification: notificationResult
        ? {
            alertId: notificationResult.alert?._id,
            status: notificationResult.status,
            emailStatus: notificationResult.emailStatus,
            recipient: notificationResult.recipient || notificationResult.alert?.recipientEmail,
            messageId: notificationResult.messageId || null,
            previewUrl: notificationResult.previewUrl || null,
            duplicate: Boolean(notificationResult.duplicate),
            error: notificationResult.error || null,
          }
        : null,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET or POST /api/analysis/context
 * Standalone environmental context detection.
 * Completely independent from YOLO.
 *
 * Query params or body: { latitude, longitude, radius }
 */
export async function getEnvironmentalContext(req, res, next) {
  try {
    const latRaw = req.query.latitude ?? req.body?.latitude;
    const lonRaw = req.query.longitude ?? req.body?.longitude;
    const radiusRaw = req.query.radius ?? req.body?.radius;

    let lat = null;
    let lon = null;

    if (
      latRaw !== undefined &&
      latRaw !== null &&
      String(latRaw).trim() !== "" &&
      lonRaw !== undefined &&
      lonRaw !== null &&
      String(lonRaw).trim() !== ""
    ) {
      const parsedLat = parseFloat(latRaw);
      const parsedLon = parseFloat(lonRaw);
      if (
        !isNaN(parsedLat) &&
        !isNaN(parsedLon) &&
        parsedLat >= -90 &&
        parsedLat <= 90 &&
        parsedLon >= -180 &&
        parsedLon <= 180
      ) {
        lat = parsedLat;
        lon = parsedLon;
      }
    }

    const radius = radiusRaw ? parseInt(radiusRaw, 10) : 300;
    const result = await detectEnvironmentalContext(
      lat,
      lon,
      isNaN(radius) ? 300 : radius
    );

    res.json({
      success: true,
      contextType: result.contextType,
      contextLabel: result.contextLabel,
      nearbyPlaceName: result.nearbyPlaceName,
      distance: result.distance,
      source: result.source,
      coordinates: result.coordinates,
      locationName: result.locationName,
      nearbyPlaces: result.nearbyPlaces,
      allMatchedContexts: result.allMatchedContexts,
    });
  } catch (err) {
    next(err);
  }
}
