import { useState, useRef, useEffect } from "react";
import { RotateCcw, MapPin, Camera } from "lucide-react";
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

  useEffect(() => {
    if (isCapturing && videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [isCapturing, stream]);

  async function startCamera() {
    try {
      const s = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      setStream(s);
      setIsCapturing(true);
      if (videoRef.current) {
        videoRef.current.srcObject = s;
      }
    } catch (err) {
      alert("Could not access camera: " + err.message);
    }
  }

  function stopCamera() {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setIsCapturing(false);
  }

  function captureImage() {
    if (videoRef.current) {
      const canvas = document.createElement("canvas");
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(videoRef.current, 0, 0);
      canvas.toBlob((blob) => {
        if (blob) {
          const f = new File([blob], `capture-${Date.now()}.jpg`, { type: "image/jpeg" });
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
      }, "image/jpeg", 0.9);
    }
  }

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
              <div className="card p-0 flex flex-col items-center overflow-hidden border-0 bg-transparent shadow-none">
                {!isCapturing ? (
                  <button onClick={startCamera} className="group relative w-full overflow-hidden rounded-2xl bg-ink p-8 text-center transition-all hover:shadow-xl border border-line/20">
                    <div className="absolute inset-0 bg-gradient-to-br from-accent-deep/30 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
                    <div className="relative z-10 mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-md transition-transform duration-500 group-hover:scale-110 shadow-lg border border-white/10">
                      <Camera size={26} />
                    </div>
                    <h3 className="mt-5 text-sm font-bold text-white tracking-wide">Initialize Drone Uplink</h3>
                    <p className="mt-2 text-[11px] text-white/60 max-w-[200px] mx-auto leading-relaxed">
                      Connect to local camera module to simulate live aerial feed
                    </p>
                  </button>
                ) : (
                  <div className="w-full">
                    <div className="group relative overflow-hidden rounded-2xl bg-black aspect-video shadow-2xl ring-1 ring-white/10">
                      <video 
                        ref={videoRef} 
                        autoPlay 
                        playsInline 
                        muted 
                        className="w-full h-full object-cover opacity-90"
                        onLoadedMetadata={() => {
                          if (videoRef.current) {
                            videoRef.current.play().catch(e => console.warn(e));
                          }
                        }}
                      />
                      
                      {/* Telemetry HUD Overlay */}
                      <div className="absolute inset-0 pointer-events-none p-4 flex flex-col justify-between">
                        {/* Top HUD */}
                        <div className="flex justify-between items-start">
                          <div className="flex items-center gap-2 rounded-full bg-black/50 px-3 py-1.5 backdrop-blur-md border border-white/10 shadow-sm">
                            <span className="h-2 w-2 animate-pulse rounded-full bg-danger shadow-[0_0_8px_rgba(229,72,77,0.8)]" />
                            <span className="text-[10px] font-mono font-bold text-white uppercase tracking-widest">Live Link</span>
                          </div>
                          <div className="text-right bg-black/40 px-3 py-1.5 rounded-lg backdrop-blur-md border border-white/10">
                            <div className="text-[10px] font-mono text-white/80">REC // 4K 60FPS</div>
                            <div className="text-[9px] font-mono text-accent mt-0.5 tracking-wider">GPS LOCK ACQUIRING</div>
                          </div>
                        </div>

                        {/* Center Crosshairs */}
                        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center opacity-50">
                          <div className="w-20 h-20 border border-white/60 rounded-full" />
                          <div className="absolute w-[1px] h-4 bg-white/60 top-[-10px]" />
                          <div className="absolute w-[1px] h-4 bg-white/60 bottom-[-10px]" />
                          <div className="absolute w-4 h-[1px] bg-white/60 left-[-10px]" />
                          <div className="absolute w-4 h-[1px] bg-white/60 right-[-10px]" />
                          <div className="absolute w-1 h-1 bg-accent rounded-full" />
                        </div>
                        
                        {/* Bottom Bar Controls (pointer events auto so buttons work) */}
                        <div className="pointer-events-auto flex gap-3">
                          <button onClick={stopCamera} className="rounded-xl bg-black/60 px-5 py-3 text-xs font-semibold text-white backdrop-blur-md hover:bg-white/20 transition-colors border border-white/10 shadow-lg">
                            Disconnect
                          </button>
                          <button onClick={captureImage} className="flex-1 rounded-xl bg-accent px-5 py-3 text-xs font-bold text-white shadow-[0_0_20px_rgba(47,203,138,0.5)] hover:bg-accent-deep transition-all flex items-center justify-center gap-2">
                            <Camera size={14} />
                            CAPTURE FRAME
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
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
