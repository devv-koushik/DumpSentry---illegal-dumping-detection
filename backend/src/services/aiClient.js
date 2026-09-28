import fs from "fs";
import fetch from "node-fetch";
import FormData from "form-data";
import env from "../config/env.js";

/**
 * Call the Python FastAPI AI service to run YOLO inference on an image.
 *
 * @param {string} imagePath  Absolute path to the uploaded image file
 * @returns {Promise<{
 *   wasteDetected: boolean,
 *   detections: Array<{ class: string, confidence: number, bbox: object }>,
 *   annotatedImageBase64: string | null
 * }>}
 */
export async function runInference(imagePath) {
  const form = new FormData();
  form.append("file", fs.createReadStream(imagePath));

  const url = `${env.aiServiceUrl}/predict`;

  let response;
  try {
    response = await fetch(url, {
      method: "POST",
      body: form,
      headers: form.getHeaders(),
      timeout: 60000, // 60s for large images
    });
  } catch (err) {
    throw new Error(
      `AI service unreachable at ${url}. Is the Python service running? (${err.message})`
    );
  }

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(`AI service returned ${response.status}: ${text}`);
  }

  const data = await response.json();

  return {
    wasteDetected: data.waste_detected ?? data.wasteDetected ?? false,
    detections: (data.detections || []).map((d) => ({
      class: d.class || d.label || "unknown",
      confidence: Math.round((d.confidence ?? d.score ?? 0) * 100) / 100,
      bbox: {
        x: Math.round(d.bbox?.x ?? d.x ?? 0),
        y: Math.round(d.bbox?.y ?? d.y ?? 0),
        width: Math.round(d.bbox?.width ?? d.bbox?.w ?? d.w ?? 0),
        height: Math.round(d.bbox?.height ?? d.bbox?.h ?? d.h ?? 0),
      },
    })),
    annotatedImageBase64: data.annotated_image_base64 ?? data.annotatedImageBase64 ?? null,
  };
}

/**
 * Health-check the AI service.
 */
export async function checkAIHealth() {
  try {
    const res = await fetch(`${env.aiServiceUrl}/health`, { timeout: 5000 });
    if (!res.ok) return { status: "unhealthy", code: res.status };
    return await res.json();
  } catch (err) {
    return { status: "unreachable", error: err.message };
  }
}
