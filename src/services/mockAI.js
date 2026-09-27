// Mock AI inference service. `analyzeImage` simulates calling a real
// computer-vision model (e.g. a YOLO-based detector + classifier served
// behind an API) by resolving after a delay with a plausible result.
//
// To connect a real model later: replace the body of `analyzeImage` with
// a fetch()/axios call to your inference endpoint, keep the same return
// shape, and nothing else in the app needs to change.

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
 * Simulates running a drone image through the detection pipeline.
 * @param {File|string} image
 * @param {(stageIndex: number, stageLabel: string) => void} onProgress
 */
export async function analyzeImage(image, onProgress = () => {}) {
  for (let i = 0; i < ANALYSIS_STAGES.length; i++) {
    onProgress(i, ANALYSIS_STAGES[i]);
    await delay(i === 0 ? 500 : 650);
  }

  const wasteDetected = Math.random() > 0.08; // occasionally "clean" for realism
  const wasteType = randomFrom(WASTE_TYPES);
  const context = randomFrom(CONTEXTS);
  const confidence = Math.round(62 + Math.random() * 34); // 62–96%
  const authority = getAuthorityForContext(context);
  const status = !wasteDetected
    ? "No Waste Detected"
    : confidence >= 80
    ? "Suspected Illegal Dumping"
    : "Requires Verification";

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
