import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, X, RotateCcw, Sparkles, MapPin, AlertTriangle, ShieldCheck } from "lucide-react";
import { analyzeImage, ANALYSIS_STAGES } from "../../services/mockAI";
import { useAuth } from "../../context/AuthContext";

export default function UploadModal({ isOpen, onClose, onAddDetection }) {
  const { isAdmin, requireAdmin } = useAuth();
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [stageIndex, setStageIndex] = useState(-1);
  const [result, setResult] = useState(null);

  if (!isOpen || !isAdmin) return null;

  function handleFileChange(e) {
    if (!requireAdmin("upload drone captures and run AI vision detection")) return;
    const selected = e.target.files?.[0];
    if (selected) {
      setFile(selected);
      setPreviewUrl(URL.createObjectURL(selected));
      setResult(null);
      setStageIndex(-1);
    }
  }

  function handleDrop(e) {
    e.preventDefault();
    if (!requireAdmin("upload drone captures and run AI vision detection")) return;
    const dropped = e.dataTransfer.files?.[0];
    if (dropped) {
      setFile(dropped);
      setPreviewUrl(URL.createObjectURL(dropped));
      setResult(null);
      setStageIndex(-1);
    }
  }

  async function handleRunAnalysis() {
    if (!requireAdmin("run the YOLOv11 AI detection pipeline")) return;
    if (!file) return;
    setAnalyzing(true);
    setResult(null);

    const res = await analyzeImage(file, (idx) => setStageIndex(idx));
    setResult(res);
    setAnalyzing(false);

    // If waste detected, optionally add to live dashboard map
    if (res.wasteDetected && onAddDetection) {
      onAddDetection({
        id: `DET-${Math.floor(100 + Math.random() * 900)}`,
        latitude: 22.565 + (Math.random() - 0.5) * 0.04,
        longitude: 88.385 + (Math.random() - 0.5) * 0.04,
        timestamp: "Just now",
        status: res.status,
        confidence: res.confidence,
        wasteType: res.wasteType,
        context: res.context,
        location: "Captured Location, Kolkata",
        authority: res.authority,
        estVolume: "3.5 m³",
        riskLevel: res.status === "Suspected Illegal" ? "High" : "Medium",
        image: previewUrl,
        aiAnalysis: {
          boxes: res.boundingBoxes || [{ x: 20, y: 25, w: 55, h: 50 }],
          environmentalRisk: "High risk to nearby drainage.",
          recommendedAction: `Dispatched alert to ${res.authority}`,
        },
      });
    }
  }

  function handleReset() {
    setFile(null);
    setPreviewUrl("");
    setResult(null);
    setStageIndex(-1);
    setAnalyzing(false);
  }

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[1200] flex items-center justify-center bg-ink/40 backdrop-blur-md p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="relative w-full max-w-2xl overflow-hidden rounded-2xl bg-white border border-line shadow-2xl font-cmd"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-line bg-paper px-6 py-4">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-accent/10 text-accent-deep">
                <Upload size={18} />
              </div>
              <div>
                <h3 className="text-sm font-bold tracking-wide text-ink uppercase">
                  Upload Drone Capture
                </h3>
                <p className="text-[11px] text-muted">
                  AI CV Pipeline — Automatic Waste Detection & Authority Routing
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="rounded-full p-1.5 text-muted hover:bg-paper2 hover:text-ink transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          {/* Body */}
          <div className="p-6 space-y-5">
            {!previewUrl ? (
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
                className="group relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-line bg-paper/50 p-10 text-center transition-all hover:border-accent hover:bg-accent/5 cursor-pointer"
              >
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
                <div className="mb-3 rounded-full bg-paper2 p-4 text-muted group-hover:bg-accent/10 group-hover:text-accent-deep transition-colors">
                  <Upload size={28} />
                </div>
                <p className="text-xs font-semibold text-ink">
                  Click or drag drone image here
                </p>
                <p className="mt-1 text-[11px] text-muted">
                  Supports JPG, PNG, WEBP (Max 25MB aerial captures)
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="relative h-64 w-full overflow-hidden rounded-xl bg-paper border border-line">
                  <img
                    src={previewUrl}
                    alt="Drone capture preview"
                    className="h-full w-full object-cover"
                  />
                  {result?.wasteDetected &&
                    result.boundingBoxes?.map((box, i) => (
                      <div
                        key={i}
                        className="pointer-events-none absolute rounded border-2 border-accent bg-accent/20 animate-pulse"
                        style={{
                          left: `${box.x}%`,
                          top: `${box.y}%`,
                          width: `${box.w}%`,
                          height: `${box.h}%`,
                        }}
                      >
                        <span className="absolute -top-5 left-0 rounded bg-accent px-1.5 py-0.5 text-[9px] font-bold text-white uppercase">
                          {result.wasteType} ({result.confidence}%)
                        </span>
                      </div>
                    ))}
                </div>

                {/* Status / Actions bar */}
                <div className="flex items-center justify-between">
                  <button
                    onClick={handleReset}
                    className="flex items-center gap-1.5 text-xs text-muted hover:text-ink transition-colors"
                  >
                    <RotateCcw size={13} /> Select another image
                  </button>

                  {!result && (
                    <button
                      onClick={handleRunAnalysis}
                      disabled={analyzing}
                      className="flex items-center gap-2 rounded-xl bg-accent px-5 py-2 text-xs font-semibold text-white shadow-md hover:bg-accent-deep transition-all disabled:opacity-50"
                    >
                      <Sparkles size={14} />
                      {analyzing ? "Running AI Detection..." : "Analyze Drone Capture"}
                    </button>
                  )}
                </div>

                {/* Pipeline steps animation */}
                {analyzing && (
                  <div className="space-y-2 rounded-xl bg-paper p-4 border border-line">
                    <p className="text-[11px] font-semibold text-ink flex items-center gap-1.5">
                      <Sparkles size={12} className="text-accent animate-spin" />
                      Processing Aerial Vision Models...
                    </p>
                    <div className="grid grid-cols-4 gap-2">
                      {ANALYSIS_STAGES.map((stg, i) => (
                        <div
                          key={i}
                          className={`rounded-lg p-2 text-center border text-[9px] transition-all ${
                            i <= stageIndex
                              ? "bg-accent/10 border-accent/40 text-accent-deep font-semibold"
                              : "bg-white border-line text-muted"
                          }`}
                        >
                          {typeof stg === "object" ? stg.title : stg}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* AI Detection Result Summary */}
                {result && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-xl border border-line bg-paper/60 p-4 space-y-3"
                  >
                    <div className="flex items-center justify-between border-b border-line pb-2.5">
                      <div className="flex items-center gap-2">
                        {result.wasteDetected ? (
                          <AlertTriangle size={16} className="text-danger" />
                        ) : (
                          <ShieldCheck size={16} className="text-success" />
                        )}
                        <span className="text-xs font-bold text-ink">
                          {result.wasteDetected
                            ? "Illegal Dump Suspected"
                            : "No Waste Detected"}
                        </span>
                      </div>
                      <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-accent/15 text-accent-deep">
                        {result.confidence}% AI Confidence
                      </span>
                    </div>

                    {result.wasteDetected && (
                      <div className="grid grid-cols-3 gap-3 text-[11px]">
                        <div>
                          <span className="text-muted block text-[10px]">Type</span>
                          <span className="font-semibold text-ink">{result.wasteType}</span>
                        </div>
                        <div>
                          <span className="text-muted block text-[10px]">Context</span>
                          <span className="font-semibold text-ink">{result.context}</span>
                        </div>
                        <div>
                          <span className="text-muted block text-[10px]">Route To</span>
                          <span className="font-semibold text-accent-deep">
                            {result.authority}
                          </span>
                        </div>
                      </div>
                    )}
                  </motion.div>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between border-t border-line bg-paper px-6 py-3">
            <span className="text-[10px] text-muted flex items-center gap-1">
              <MapPin size={11} /> Auto-georeferenced to Active Drone Telemetry
            </span>
            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded-lg text-xs font-medium text-muted hover:bg-paper2 hover:text-ink transition-colors"
            >
              Close
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
