import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertTriangle,
  X,
  MapPin,
  Camera,
  Send,
  CheckCircle2,
} from "lucide-react";

import { savePublicReport } from "../services/publicReports";

const PROBLEM_TYPES = [
  "Illegal Garbage Dumping",
  "Construction Debris / C&D Waste",
  "Hazardous / Biomedical Waste",
  "Plastic Waste Accumulation",
  "Overflowing Public Bin / Drain Blockage",
  "Other Environmental Violation",
];

const CONTEXT_OPTIONS = [
  "Hospital / Healthcare Facility",
  "School / College / University",
  "Roadside / Highway Corridor",
  "Residential Neighborhood",
  "Public Park / Water Body",
  "Commercial / Industrial Area",
];

export default function ReportProblemModal({ isOpen, onClose, onSubmitted }) {
  const [formData, setFormData] = useState({
    location: "",
    landmark: "",
    problemType: PROBLEM_TYPES[0],
    context: CONTEXT_OPTIONS[0],
    description: "",
    reporterName: "",
    reporterContact: "",
    imageFile: null,
    imagePreview: "",
  });

  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [reportId, setReportId] = useState("");

  if (!isOpen) return null;

  function handleFileChange(e) {
    const file = e.target.files?.[0];
    if (file) {
      setFormData((prev) => ({
        ...prev,
        imageFile: file,
        imagePreview: URL.createObjectURL(file),
      }));
    }
  }

  function handleUseCurrentLocation() {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setFormData((prev) => ({
            ...prev,
            location: `${latitude.toFixed(5)}°N, ${longitude.toFixed(5)}°E (Current GPS)`,
          }));
        },
        () => {
          setFormData((prev) => ({
            ...prev,
            location: "Sector V, Salt Lake, Kolkata (Default GPS)",
          }));
        }
      );
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!formData.location.trim()) return;

    setSubmitting(true);
    await new Promise((resolve) => setTimeout(resolve, 800));

    const generatedId = `PUB-${Math.floor(1000 + Math.random() * 9000)}`;
    const newReport = {
      id: generatedId,
      ...formData,
      status: "Pending Review",
      priority: formData.problemType.includes("Biomedical") || formData.context.includes("Hospital") ? "Urgent" : "High",
      timestamp: new Date().toISOString(),
      assignedAuthority: formData.context.includes("Hospital")
        ? "Hospital Superintendent / Borough Health Officer"
        : formData.context.includes("School")
        ? "School Administration / Civic Zone"
        : "Municipal SWM & PWD",
    };

    try {
      await savePublicReport(newReport);
      setReportId(generatedId);
      setSubmitting(false);
      setSubmitted(true);

      if (onSubmitted) {
        onSubmitted(newReport);
      }
    } catch (err) {
      console.error(err);
      alert("Failed to submit report. Please try again.");
      setSubmitting(false);
    }
  }

  function handleResetAndClose() {
    setSubmitted(false);
    setFormData({
      location: "",
      landmark: "",
      problemType: PROBLEM_TYPES[0],
      context: CONTEXT_OPTIONS[0],
      description: "",
      reporterName: "",
      reporterContact: "",
      imageFile: null,
      imagePreview: "",
    });
    onClose();
  }

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[1200] flex items-center justify-center bg-ink/40 backdrop-blur-md p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="relative w-full max-w-xl overflow-hidden rounded-2xl bg-white border border-line shadow-2xl font-cmd"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-line bg-paper px-6 py-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-accent/10 border border-accent/20 text-accent-deep">
                <AlertTriangle size={18} />
              </div>
              <div>
                <h3 className="text-sm font-bold tracking-wide text-ink uppercase">
                  Report a Dumping Problem
                </h3>
                <p className="text-[11px] text-muted">
                  Public citizen reporting — alerts the nearest municipal authority
                </p>
              </div>
            </div>
            <button
              onClick={handleResetAndClose}
              className="rounded-full p-1.5 text-muted hover:bg-paper2 hover:text-ink transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          {/* Body */}
          {submitted ? (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-8 text-center"
            >
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-success/10 text-success">
                <CheckCircle2 size={32} />
              </div>
              <span className="rounded-full bg-success/15 px-3 py-1 text-xs font-semibold text-success uppercase tracking-wider font-mono">
                Report #{reportId} Filed
              </span>
              <h4 className="mt-3 text-lg font-bold text-ink">
                Thank you for reporting!
              </h4>
              <p className="mx-auto mt-2 max-w-md text-xs leading-relaxed text-muted">
                Your report has been logged and routed to the corresponding municipal jurisdiction. Surveillance drones in that patrol corridor will prioritize verification.
              </p>

              <div className="mt-6 flex justify-center">
                <button
                  onClick={handleResetAndClose}
                  className="rounded-xl bg-accent px-6 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-accent-deep transition-all uppercase tracking-wider"
                >
                  Done
                </button>
              </div>
            </motion.div>
          ) : (
            <form onSubmit={handleSubmit} className="max-h-[80vh] overflow-y-auto p-6 space-y-4">
              {/* Problem Type & Context */}
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-muted">
                    Issue Category
                  </label>
                  <select
                    value={formData.problemType}
                    onChange={(e) =>
                      setFormData({ ...formData, problemType: e.target.value })
                    }
                    className="w-full rounded-xl border border-line bg-paper/60 px-3 py-2 text-xs text-ink outline-none focus:border-accent/40"
                  >
                    {PROBLEM_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-muted">
                    Surrounding Area Context
                  </label>
                  <select
                    value={formData.context}
                    onChange={(e) =>
                      setFormData({ ...formData, context: e.target.value })
                    }
                    className="w-full rounded-xl border border-line bg-paper/60 px-3 py-2 text-xs text-ink outline-none focus:border-accent/40"
                  >
                    {CONTEXT_OPTIONS.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Location Input with GPS button */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-[10px] font-semibold uppercase tracking-wider text-muted">
                    Location / Address *
                  </label>
                  <button
                    type="button"
                    onClick={handleUseCurrentLocation}
                    className="flex items-center gap-1 text-[10px] font-medium text-accent-deep hover:underline"
                  >
                    <MapPin size={11} /> Auto-detect GPS
                  </button>
                </div>
                <input
                  type="text"
                  required
                  placeholder="e.g. Near Kasba Connector, opposite Gate 2"
                  value={formData.location}
                  onChange={(e) =>
                    setFormData({ ...formData, location: e.target.value })
                  }
                  className="w-full rounded-xl border border-line bg-paper/60 px-3.5 py-2 text-xs text-ink placeholder:text-muted/60 outline-none focus:border-accent/40"
                />
              </div>

              {/* Landmark / Description */}
              <div>
                <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-muted">
                  Description / Landmark Details
                </label>
                <textarea
                  rows={3}
                  placeholder="Describe the waste buildup, any visible hazards, or how long it has been accumulating..."
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  className="w-full resize-none rounded-xl border border-line bg-paper/60 px-3.5 py-2 text-xs text-ink placeholder:text-muted/60 outline-none focus:border-accent/40"
                />
              </div>

              {/* Image Upload / Photo attachment */}
              <div>
                <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-muted">
                  Attach Photo (Optional)
                </label>
                <div className="flex items-center gap-3">
                  <label className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-dashed border-line bg-paper/40 px-4 py-3 text-xs text-muted hover:border-accent hover:text-ink cursor-pointer transition-colors">
                    <Camera size={14} className="text-accent" />
                    <span>{formData.imageFile ? formData.imageFile.name : "Choose photo or capture"}</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </label>
                  {formData.imagePreview && (
                    <img
                      src={formData.imagePreview}
                      alt="Preview"
                      className="h-11 w-11 rounded-lg object-cover border border-line"
                    />
                  )}
                </div>
              </div>

              {/* Citizen Contact (Optional) */}
              <div className="grid gap-3 sm:grid-cols-2 pt-1 border-t border-line/60">
                <div>
                  <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-muted">
                    Your Name (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="Citizen / Anonymous"
                    value={formData.reporterName}
                    onChange={(e) =>
                      setFormData({ ...formData, reporterName: e.target.value })
                    }
                    className="w-full rounded-xl border border-line bg-paper/60 px-3.5 py-1.5 text-xs text-ink placeholder:text-muted/60 outline-none focus:border-accent/40"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-muted">
                    Phone / Email (For updates)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. resident@gmail.com"
                    value={formData.reporterContact}
                    onChange={(e) =>
                      setFormData({ ...formData, reporterContact: e.target.value })
                    }
                    className="w-full rounded-xl border border-line bg-paper/60 px-3.5 py-1.5 text-xs text-ink placeholder:text-muted/60 outline-none focus:border-accent/40"
                  />
                </div>
              </div>

              {/* Submit CTA */}
              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={handleResetAndClose}
                  className="rounded-xl px-4 py-2 text-xs font-medium text-muted hover:bg-paper2 hover:text-ink transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || !formData.location.trim()}
                  className="flex items-center gap-1.5 rounded-xl bg-accent px-5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-accent-deep disabled:opacity-40 transition-all uppercase tracking-wider"
                >
                  {submitting ? (
                    <span>Submitting...</span>
                  ) : (
                    <>
                      <Send size={12} />
                      <span>Submit Report</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
