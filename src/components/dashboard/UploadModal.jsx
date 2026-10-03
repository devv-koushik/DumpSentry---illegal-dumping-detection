import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, X, RotateCcw, Sparkles, MapPin, AlertTriangle, ShieldCheck } from "lucide-react";
import { analyzeImage, ANALYSIS_STAGES } from "../../services/api";
import { useAuth } from "../../context/AuthContext";

export default function UploadModal({ isOpen, onClose, onAddDetection }) {
  const { isAdmin, requireAdmin } = useAuth();
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [stageIndex, setStageIndex] = useState(-1);
  const [result, setResult] = useState(null);
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  if (!isOpen) return null;

  function handleFileChange(e) {
    const selected = e.target.files?.[0];
    if (selected) {
      setFile(selected);
      setPreviewUrl(URL.createObjectURL(selected));
      setResult(null);
      setStageIndex(-1);
      setErrorMsg("");
    }
  }

  function handleDrop(e) {
    e.preventDefault();
    const dropped = e.dataTransfer.files?.[0];
    if (dropped) {
      setFile(dropped);
      setPreviewUrl(URL.createObjectURL(dropped));
      setResult(null);
      setStageIndex(-1);
      setErrorMsg("");
    }
  }

  async function handleRunAnalysis() {
    if (!file) return;
    setAnalyzing(true);
    setResult(null);
    setErrorMsg("");

    try {
      const coords =
        latitude.trim() && longitude.trim()
          ? { latitude: latitude.trim(), longitude: longitude.trim() }
          : null;

      const res = await analyzeImage(file, (idx) => setStageIndex(idx), coords);
      setResult(res);

      // Add real detection record to live dashboard
      if (onAddDetection) {
        onAddDetection({
          id: res.id || res.detectionId,
          detectionId: res.detectionId || res.id,
          latitude: res.latitude ?? null,
          longitude: res.longitude ?? null,
          timestamp: res.analyzedAt || new Date().toISOString(),
          status: res.status,
          confidence: res.confidence,
          wasteType: res.wasteType,
          wasteTypes: res.wasteTypes,
          context: res.context,
          location: res.location,
          authority: res.authority,
          image: res.annotatedImageUrl || res.image || previewUrl,
          nearbyPlaces: res.nearbyPlaces || [],
        });
      }
    } catch (err) {
      setErrorMsg(err.message || "Failed to run AI detection pipeline.");
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
                    src={result?.annotatedImageUrl || previewUrl}
                    alt="Drone capture preview"
                    className="h-full w-full object-cover"
                  />
                </div>

                {/* Optional GPS Telemetry */}
                {!result && !analyzing && (
                  <div className="rounded-xl border border-line bg-paper/60 p-3 space-y-1.5">
                    <span className="text-[11px] font-medium text-ink flex items-center gap-1.5">
                      <MapPin size={12} className="text-accent" />
                      Optional Coordinates (Environmental Context):
                    </span>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        placeholder="Latitude (e.g. 22.5851)"
                        value={latitude}
                        onChange={(e) => setLatitude(e.target.value)}
                        className="rounded-lg border border-line bg-white px-2.5 py-1 text-xs text-ink outline-none focus:border-accent"
                      />
                      <input
                        type="text"
                        placeholder="Longitude (e.g. 88.4203)"
                        value={longitude}
                        onChange={(e) => setLongitude(e.target.value)}
                        className="rounded-lg border border-line bg-white px-2.5 py-1 text-xs text-ink outline-none focus:border-accent"
                      />
                    </div>
                  </div>
                )}

                {errorMsg && (
                  <div className="rounded-xl border border-danger/20 bg-danger/10 p-3 text-xs text-danger">
                    {errorMsg}
                  </div>
                )}

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
