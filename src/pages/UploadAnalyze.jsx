import { useState } from "react";
import { RotateCcw, MapPin, Cpu } from "lucide-react";
import PageHeader from "../components/PageHeader";
import UploadZone from "../components/UploadZone";
import AIAnalysisProgress from "../components/AIAnalysisProgress";
import DetectionStatus from "../components/DetectionStatus";
import ConfidenceBadge from "../components/ConfidenceBadge";
import { analyzeImage, ANALYSIS_STAGES } from "../services/api";

export default function UploadAnalyze() {
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [stageIndex, setStageIndex] = useState(-1);
  const [result, setResult] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  function handleFile(f) {
    setFile(f);
    setPreviewUrl(URL.createObjectURL(f));
    setResult(null);
    setStageIndex(-1);
    setErrorMsg("");
  }

  async function handleAnalyze() {
    setAnalyzing(true);
    setResult(null);
    setErrorMsg("");
    try {
      const coords =
        latitude.trim() && longitude.trim()
          ? { latitude: latitude.trim(), longitude: longitude.trim() }
          : null;
      const res = await analyzeImage(file, (i) => setStageIndex(i), coords);
      setResult(res);
    } catch (err) {
      setErrorMsg(err.message || "Failed to analyze image. Please ensure services are running.");
    } finally {
      setAnalyzing(false);
    }
  }

  function handleReset() {
    setFile(null);
    setPreviewUrl("");
    setResult(null);
    setStageIndex(-1);
    setAnalyzing(false);
    setLatitude("");
    setLongitude("");
    setErrorMsg("");
  }

  return (
    <div>
      <PageHeader
        title="Analyze New Drone Image"
        description="Upload a drone capture to run it through the YOLOv11 AI detection pipeline with geospatial authority routing."
      />

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            {!previewUrl ? (
              <UploadZone onFileSelected={handleFile} />
            ) : (
              <div className="card overflow-hidden">
                <div className="relative">
                  <img
                    src={result?.annotatedImageUrl || previewUrl}
                    alt="Uploaded preview"
                    className="h-80 w-full object-cover sm:h-[420px]"
                  />
                </div>

                {/* Optional GPS Telemetry for laptop testing */}
                {!result && !analyzing && (
                  <div className="border-t border-line bg-paper/60 px-5 py-3">
                    <p className="text-[11px] font-medium text-ink flex items-center gap-1.5 mb-2">
                      <MapPin size={12} className="text-accent" />
                      Optional GPS Coordinates (for Environmental Context & Authority Routing):
                    </p>
                    <div className="grid grid-cols-2 gap-3 max-w-sm">
                      <input
                        type="text"
                        placeholder="Latitude (e.g. 22.5354)"
                        value={latitude}
                        onChange={(e) => setLatitude(e.target.value)}
                        className="rounded-lg border border-line bg-white px-3 py-1.5 text-xs text-ink outline-none focus:border-accent"
                      />
                      <input
                        type="text"
                        placeholder="Longitude (e.g. 88.3616)"
                        value={longitude}
                        onChange={(e) => setLongitude(e.target.value)}
                        className="rounded-lg border border-line bg-white px-3 py-1.5 text-xs text-ink outline-none focus:border-accent"
                      />
                    </div>
                  </div>
                )}

                {errorMsg && (
                  <div className="border-t border-danger/20 bg-danger/10 px-5 py-2.5 text-xs text-danger">
                    {errorMsg}
                  </div>
                )}

                <div className="flex flex-wrap items-center justify-between gap-3 p-5">
                  <p className="text-sm text-muted">{file?.name}</p>
                  <div className="flex gap-2">
                    <button onClick={handleReset} className="btn-ghost !py-2 text-xs">
                      <RotateCcw size={13} /> Reset
                    </button>
                    {!result && (
                      <button onClick={handleAnalyze} disabled={analyzing} className="btn-accent !py-2 text-xs disabled:opacity-50">
                        {analyzing ? "Analyzing…" : "Analyze Image"}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}

            {result && (
              <div className="card mt-6 p-6">
                <p className="mb-5 font-medium text-ink">AI Result</p>
                {!result.wasteDetected ? (
                  <div className="space-y-4">
                    <p className="text-sm text-muted">No waste detected by YOLO vision model. Incident marked as Clean.</p>
                    <dl className="grid grid-cols-2 gap-y-5 text-sm sm:grid-cols-3">
                      <Field label="Garbage Detected" value="No" />
                      <Field label="Status" value={<DetectionStatus status={result.status || "Clean"} />} />
                      <Field label="Context" value={result.context} />
                    </dl>
                  </div>
                ) : (
                  <dl className="grid grid-cols-2 gap-y-5 text-sm sm:grid-cols-3">
                    <Field label="Incident ID" value={result.detectionId || result.id || "Recorded"} />
                    <Field label="Waste Classes" value={result.wasteType} />
                    <Field label="Confidence" value={<ConfidenceBadge value={result.confidence} />} />
                    <Field label="Environmental Context" value={result.context} />
                    <Field label="Incident Status" value={<DetectionStatus status={result.status} />} />
                    <Field label="Responsible Authority" value={result.authority} />
                    <Field label="Location" value={result.location || "Location Unavailable"} />
                    <Field
                      label="GPS Coordinates"
                      value={
                        result.latitude != null && result.longitude != null
                          ? `${Number(result.latitude).toFixed(4)}, ${Number(result.longitude).toFixed(4)}`
                          : "Location Unavailable"
                      }
                    />
                    <Field
                      label="Nearby Places"
                      value={
                        result.nearbyPlaces?.length > 0
                          ? result.nearbyPlaces.map((p) => `${p.name} (${p.distance}m)`).join(", ")
                          : "None detected within 300m"
                      }
                    />
                  </dl>
                )}
              </div>
            )}
          </div>

          <div>
            {analyzing || result ? (
              <AIAnalysisProgress activeIndex={result ? ANALYSIS_STAGES.length : stageIndex} />
            ) : (
              <div className="card p-6">
                <p className="eyebrow mb-3">Pipeline Overview</p>
                <ul className="space-y-3 text-sm text-muted">
                  <li className="flex gap-2.5"><Cpu size={14} className="mt-0.5 flex-shrink-0 text-accent" /> YOLOv11 AI model detects and classifies waste types.</li>
                  <li className="flex gap-2.5"><MapPin size={14} className="mt-0.5 flex-shrink-0 text-accent" /> GPS + OSM geospatial lookup identifies nearby facilities.</li>
                  <li className="flex gap-2.5"><MapPin size={14} className="mt-0.5 flex-shrink-0 text-accent" /> Rule engine routes alerts to the correct authority automatically.</li>
                  <li className="flex gap-2.5 text-xs"><MapPin size={13} className="mt-0.5 flex-shrink-0" /> All AI outputs require human verification before enforcement action.</li>
                </ul>
              </div>
            )}
          </div>
      </div>
    </div>
  );
}

function Field({ label, value }) {
  return (
    <div>
      <dt className="text-xs text-muted">{label}</dt>
      <dd className="mt-1 font-medium text-ink">{value}</dd>
    </div>
  );
}
