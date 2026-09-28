import { useState } from "react";
import { RotateCcw, MapPin, Cpu } from "lucide-react";
import PageHeader from "../components/PageHeader";
import UploadZone from "../components/UploadZone";
import AIAnalysisProgress from "../components/AIAnalysisProgress";
import DetectionStatus from "../components/DetectionStatus";
import ConfidenceBadge from "../components/ConfidenceBadge";
import { analyzeImage, ANALYSIS_STAGES } from "../services/mockAI";

export default function UploadAnalyze() {
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [stageIndex, setStageIndex] = useState(-1);
  const [result, setResult] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);

  function handleFile(f) {
    setFile(f);
    setPreviewUrl(URL.createObjectURL(f));
    setResult(null);
    setStageIndex(-1);
  }

  async function handleAnalyze() {
    setAnalyzing(true);
    setResult(null);
    const res = await analyzeImage(file, (i) => setStageIndex(i));
    setResult(res);
    setAnalyzing(false);
  }

  function handleReset() {
    setFile(null);
    setPreviewUrl("");
    setResult(null);
    setStageIndex(-1);
    setAnalyzing(false);
  }

  return (
    <div>
      <PageHeader title="Analyze New Drone Image" description="Upload a drone capture to run it through the YOLOv11 AI detection pipeline with geospatial authority routing." />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          {!previewUrl ? (
            <UploadZone onFileSelected={handleFile} />
          ) : (
            <div className="card overflow-hidden">
              <div className="relative">
                <img src={previewUrl} alt="Uploaded preview" className="h-80 w-full object-cover sm:h-[420px]" />
                {result?.wasteDetected &&
                  result.boundingBoxes.map((b, i) => (
                    <div
                      key={i}
                      className="pointer-events-none absolute rounded-md border-2 border-accent"
                      style={{ left: `${b.x}%`, top: `${b.y}%`, width: `${b.w}%`, height: `${b.h}%` }}
                    />
                  ))}
              </div>
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
                <p className="text-sm text-muted">No waste detected in this image. Nothing to route.</p>
              ) : (
                <dl className="grid grid-cols-2 gap-y-5 text-sm sm:grid-cols-3">
                  <Field label="Garbage Detected" value="Yes" />
                  <Field label="Waste Type" value={result.wasteType} />
                  <Field label="Context" value={result.context} />
                  <Field label="Confidence" value={<ConfidenceBadge value={result.confidence} />} />
                  <Field label="Status" value={<DetectionStatus status={result.status} />} />
                  <Field label="Responsible Authority" value={result.authority} />
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
