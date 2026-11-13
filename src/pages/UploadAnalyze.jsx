import { useState, useRef, useEffect, useCallback } from "react";
import { RotateCcw, MapPin, Camera, X, RefreshCw, Maximize2, Radio } from "lucide-react";
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
  
  const videoRef = useRef(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [stream, setStream] = useState(null);
  const [facingMode, setFacingMode] = useState("environment");

  // Keep video element attached to active stream
  useEffect(() => {
    if (isCapturing && videoRef.current && stream) {
      videoRef.current.srcObject = stream;
      videoRef.current.play().catch((e) => console.warn("Video play error:", e));
    }
  }, [isCapturing, stream]);

  // Clean up media stream when component unmounts
  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [stream]);

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
    setIsCapturing(false);
  }, [stream]);

  const handleFile = useCallback((f) => {
    setFile(f);
    setPreviewUrl(URL.createObjectURL(f));
    setResult(null);
    setStageIndex(-1);
    setErrorMsg("");
  }, []);

  const captureImage = useCallback(() => {
    if (videoRef.current) {
      const canvas = document.createElement("canvas");
      canvas.width = videoRef.current.videoWidth || 1920;
      canvas.height = videoRef.current.videoHeight || 1080;
      const ctx = canvas.getContext("2d");

      // Default horizontal mirror so capture matches the natural mirrored viewfinder
      ctx.save();
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      ctx.restore();

      canvas.toBlob((blob) => {
        if (blob) {
          const f = new File([blob], `drone-capture-${Date.now()}.jpg`, { type: "image/jpeg" });
          handleFile(f);
          stopCamera();

          if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
              (position) => {
                setLatitude(position.coords.latitude.toFixed(6));
                setLongitude(position.coords.longitude.toFixed(6));
              },
              (err) => console.warn("GPS fetch failed:", err)
            );
          }
        }
      }, "image/jpeg", 0.95);
    }
  }, [handleFile, stopCamera]);

  // Keyboard controls for viewfinder: Space to capture, Esc to close
  useEffect(() => {
    if (!isCapturing) return;
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        stopCamera();
      } else if (e.key === " " || e.key === "Enter") {
        e.preventDefault();
        captureImage();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isCapturing, captureImage, stopCamera]);

  async function startCamera(mode = facingMode) {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
    try {
      let s;
      try {
        s = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: mode,
            width: { ideal: 1920 },
            height: { ideal: 1080 },
          },
          audio: false,
        });
      } catch {
        // Fallback for laptops or webcams without specific facingMode constraints
        s = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      }
      setStream(s);
      setIsCapturing(true);
      if (videoRef.current) {
        videoRef.current.srcObject = s;
      }
      if (navigator.geolocation && (!latitude || !longitude)) {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            setLatitude(pos.coords.latitude.toFixed(6));
            setLongitude(pos.coords.longitude.toFixed(6));
          },
          (err) => console.warn("GPS fetch failed:", err)
        );
      }
    } catch (err) {
      alert("Could not access camera: " + err.message);
    }
  }

  function toggleCamera() {
    const nextMode = facingMode === "environment" ? "user" : "environment";
    setFacingMode(nextMode);
    startCamera(nextMode);
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
              <UploadZone onFileSelected={handleFile} onCameraClick={() => startCamera()} />
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
              <div className="card p-0 flex flex-col items-center overflow-hidden border-0 bg-transparent shadow-none">
                <button
                  type="button"
                  onClick={() => startCamera()}
                  className="group relative w-full overflow-hidden rounded-2xl bg-ink p-8 text-center transition-all hover:shadow-xl border border-line/20"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-accent-deep/30 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
                  <div className="relative z-10 mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-md transition-transform duration-500 group-hover:scale-110 shadow-lg border border-white/10">
                    <Camera size={26} />
                  </div>
                  <h3 className="mt-5 text-sm font-bold text-white tracking-wide">Initialize Drone Uplink</h3>
                  <p className="mt-2 text-[11px] text-white/60 max-w-[200px] mx-auto leading-relaxed">
                    Open enlarged camera viewfinder to capture live aerial evidence
                  </p>
                  <span className="mt-4 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-accent/20 border border-accent/40 text-[10px] font-semibold text-accent uppercase tracking-wider group-hover:bg-accent group-hover:text-white transition-all shadow-sm">
                    <Maximize2 size={11} /> Open Camera Screen
                  </span>
                </button>
              </div>
            )}
          </div>
      </div>

      {/* ─── Enlarged Camera Screen / Drone Cockpit Viewfinder Modal ─── */}
      {isCapturing && (
        <div className="fixed inset-0 z-[1200] flex items-center justify-center bg-black/85 backdrop-blur-md p-3 sm:p-5 md:p-8 animate-fade-in font-cmd">
          <div className="relative flex flex-col w-full max-w-5xl max-h-[92vh] overflow-hidden rounded-3xl bg-surface border border-white/20 shadow-2xl">
            {/* Top Telemetry & Status Bar */}
            <div className="flex items-center justify-between px-5 py-3.5 bg-black/75 backdrop-blur-md border-b border-white/10 z-20">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 rounded-full bg-danger/20 border border-danger/40 px-3 py-1 text-danger">
                  <span className="h-2 w-2 rounded-full bg-danger animate-ping" />
                  <span className="text-[10px] font-mono font-bold tracking-widest uppercase">
                    LIVE DRONE AERIAL LINK
                  </span>
                </div>
                <span className="hidden sm:inline text-[10px] font-mono text-white/60 tracking-wider">
                  UHD 4K // 60 FPS
                </span>
              </div>

              <div className="flex items-center gap-3">
                <div className="hidden md:flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] font-mono text-white/70">
                  <Radio size={11} className="text-accent animate-pulse-slow" />
                  <span className="text-accent font-semibold">GPS LOCK:</span>
                  <span>{latitude && longitude ? `${latitude}, ${longitude}` : "ACQUIRING..."}</span>
                </div>

                <button
                  type="button"
                  onClick={stopCamera}
                  className="flex items-center justify-center h-8 w-8 rounded-full bg-white/10 hover:bg-white/20 text-white/80 hover:text-white transition-colors border border-white/10"
                  title="Close viewfinder (Esc)"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Big Viewport with HUD Crosshairs and Overlays */}
            <div className="relative flex-1 bg-black flex items-center justify-center overflow-hidden min-h-[380px] sm:min-h-[480px] md:min-h-[540px] lg:min-h-[600px]">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                style={{ transform: "scaleX(-1)" }}
                className="w-full h-full object-cover max-h-[70vh] bg-black"
                onLoadedMetadata={() => {
                  if (videoRef.current) {
                    videoRef.current.play().catch((e) => console.warn(e));
                  }
                }}
              />

              {/* HUD Crosshairs and Corner Reticles */}
              <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-5 sm:p-7">
                {/* Top Corner Brackets */}
                <div className="flex justify-between items-start opacity-75">
                  <div className="w-8 h-8 border-t-2 border-l-2 border-accent/80 rounded-tl-sm shadow-[0_0_8px_rgba(226,163,59,0.4)]" />
                  <div className="w-8 h-8 border-t-2 border-r-2 border-accent/80 rounded-tr-sm shadow-[0_0_8px_rgba(226,163,59,0.4)]" />
                </div>

                {/* Center Target Reticle */}
                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center pointer-events-none">
                  <div className="w-28 h-28 sm:w-36 sm:h-36 border border-accent/35 rounded-full animate-pulse-slow flex items-center justify-center">
                    <div className="w-14 h-14 sm:w-18 sm:h-18 border border-white/30 rounded-full" />
                  </div>
                  <div className="absolute w-[1px] h-9 bg-accent/70 -top-6" />
                  <div className="absolute w-[1px] h-9 bg-accent/70 -bottom-6" />
                  <div className="absolute w-9 h-[1px] bg-accent/70 -left-6" />
                  <div className="absolute w-9 h-[1px] bg-accent/70 -right-6" />
                  <div className="absolute w-2 h-2 bg-accent rounded-full shadow-[0_0_10px_#e2a33b]" />
                </div>

                {/* Bottom Corner Brackets */}
                <div className="flex justify-between items-end opacity-75">
                  <div className="w-8 h-8 border-b-2 border-l-2 border-accent/80 rounded-bl-sm shadow-[0_0_8px_rgba(226,163,59,0.4)]" />
                  <div className="w-8 h-8 border-b-2 border-r-2 border-accent/80 rounded-tr-sm shadow-[0_0_8px_rgba(226,163,59,0.4)]" />
                </div>
              </div>

              {/* Simulated Flight Telemetry HUD Overlays */}
              <div className="absolute left-5 top-5 pointer-events-none hidden sm:flex flex-col gap-1 text-[10px] font-mono text-white/80 bg-black/50 backdrop-blur-md px-3 py-2 rounded-xl border border-white/10 shadow-lg">
                <div>ALTITUDE: 42.5m AGL</div>
                <div>VELOCITY: 0.0 m/s [HOVER]</div>
                <div>GIMBAL: -35.0° PITCH</div>
              </div>

              <div className="absolute right-5 top-5 pointer-events-none hidden sm:flex flex-col gap-1 text-[10px] font-mono text-right text-white/80 bg-black/50 backdrop-blur-md px-3 py-2 rounded-xl border border-white/10 shadow-lg">
                <div>BATTERY: 92% [24.6V]</div>
                <div>LINK QUALITY: 99%</div>
                <div>MODE: AUTONOMOUS SCAN</div>
              </div>
            </div>

            {/* Bottom Actions Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-4 bg-black/85 backdrop-blur-md border-t border-white/10 z-20">
              <div className="text-xs text-white/50 font-mono hidden md:block">
                Press <kbd className="px-2 py-0.5 rounded bg-white/10 text-white font-semibold">SPACE</kbd> to capture &bull; <kbd className="px-2 py-0.5 rounded bg-white/10 text-white font-semibold">ESC</kbd> to close
              </div>

              <div className="flex items-center gap-2.5 w-full sm:w-auto justify-center sm:justify-end ml-auto">
                {/* Camera Device Switcher */}
                <button
                  type="button"
                  onClick={toggleCamera}
                  className="flex items-center gap-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white px-3.5 py-2.5 text-xs font-semibold backdrop-blur-md transition-colors border border-white/10"
                  title="Switch camera device (Front/Rear)"
                >
                  <RefreshCw size={13} />
                  <span className="hidden sm:inline">Switch Device</span>
                </button>

                <button
                  type="button"
                  onClick={stopCamera}
                  className="rounded-full bg-white/10 hover:bg-white/20 text-white px-5 py-2.5 text-xs font-semibold backdrop-blur-md transition-colors border border-white/10"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={captureImage}
                  className="flex items-center gap-2 rounded-full bg-accent hover:bg-accent-deep text-white px-7 py-2.5 text-xs font-bold tracking-wider uppercase transition-all shadow-[0_0_25px_rgba(226,163,59,0.5)] hover:shadow-[0_0_35px_rgba(226,163,59,0.8)]"
                >
                  <Camera size={15} />
                  CAPTURE FRAME
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
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
