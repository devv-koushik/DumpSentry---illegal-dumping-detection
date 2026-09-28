// DumpSentry AI Inference Service
// Calls real backend analysis pipeline (/api/analysis/analyze) with local fallback.

import * as api from "./api";
import { WASTE_TYPES, CONTEXTS } from "../data/detections";
import { getAuthorityForContext } from "../data/authorities";

const delay = (ms) => new Promise((res) => setTimeout(res, ms));

export const ANALYSIS_STAGES = [
  "Uploading",
  "Analyzing",
  "Detecting Waste",
  "Classifying Context",
  "Assigning Authority",
  "Complete",
];

function randomFrom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomBoxes(count) {
  return Array.from({ length: count }, () => ({
    x: Math.round(10 + Math.random() * 55),
    y: Math.round(10 + Math.random() * 55),
    w: Math.round(15 + Math.random() * 25),
    h: Math.round(15 + Math.random() * 25),
  }));
}

/**
 * Runs a drone image through the detection pipeline.
 * @param {File|string} image
 * @param {(stageIndex: number, stageLabel: string) => void} onProgress
 * @param {object} coords Optional GPS coordinates
 */
export async function analyzeImage(image, onProgress = () => {}, coords = null) {
  if (image instanceof File) {
    try {
      const realResult = await api.analyzeImage(image, onProgress, coords);
      if (realResult) {
        return realResult;
      }
    } catch {
      // Backend analysis offline, falling back
    }
  }

  // Fallback simulation
  for (let i = 0; i < ANALYSIS_STAGES.length; i++) {
    onProgress(i, ANALYSIS_STAGES[i]);
    await delay(i === 0 ? 300 : 400);
  }

  const wasteDetected = Math.random() > 0.08;
  const wasteType = randomFrom(WASTE_TYPES);
  const context = randomFrom(CONTEXTS);
  const confidence = Math.round(65 + Math.random() * 30);
  const authority = getAuthorityForContext(context);
  const status = !wasteDetected
    ? "No Waste Detected"
    : confidence >= 80
    ? "Suspected Illegal"
    : "Pending Review";

  return {
    wasteDetected,
    wasteType,
    context,
    confidence,
    status,
    boundingBoxes: wasteDetected ? randomBoxes(1 + Math.floor(Math.random() * 3)) : [],
    authority: authority.authority,
    authorityEmail: authority.email,
    analyzedAt: new Date().toISOString(),
  };
}
