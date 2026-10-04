import { useState } from "react";
import {
  X,
  Save,
  Shield,
  Phone,
  Building,
  User,
  Truck,
  Plus,
  Trash2,
  CheckCircle,
  Landmark,
} from "lucide-react";
import { ZONES } from "../data/wardAuthorities";

export default function EditWardAuthorityModal({
  ward,
  isOpen,
  onClose = () => {},
  onSave = () => {},
}) {
  const [formData, setFormData] = useState(() => (ward ? JSON.parse(JSON.stringify(ward)) : null));
  const [newLandmarkName, setNewLandmarkName] = useState("");
  const [newLandmarkType, setNewLandmarkType] = useState("Heritage / Public");
  const [activeTab, setActiveTab] = useState("officials"); // 'officials' | 'contact' | 'landmarks'
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  if (!isOpen || !formData) return null;

  const updateField = (path, value) => {
    setFormData((prev) => {
      const copy = { ...prev };
      const keys = path.split(".");
      let current = copy;
      for (let i = 0; i < keys.length - 1; i++) {
        if (!current[keys[i]]) current[keys[i]] = {};
        current = current[keys[i]];
      }
      current[keys[keys.length - 1]] = value;
      return copy;
    });
  };

  const handleAddLandmark = (e) => {
    e.preventDefault();
    if (!newLandmarkName.trim()) return;
    const newLm = {
      id: `lm-${Date.now().toString(36)}`,
      name: newLandmarkName.trim(),
      type: newLandmarkType,
      lat: formData.center ? formData.center[0] : 22.56,
      lng: formData.center ? formData.center[1] : 88.36,
    };
    setFormData((prev) => ({
      ...prev,
      landmarks: [...(prev.landmarks || []), newLm],
    }));
    setNewLandmarkName("");
  };

  const handleRemoveLandmark = (id) => {
    setFormData((prev) => ({
      ...prev,
      landmarks: (prev.landmarks || []).filter((lm) => lm.id !== id && lm.name !== id),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await onSave(formData.id, formData);
      setSaveSuccess(true);
      setTimeout(() => {
        setIsSaving(false);
        onClose();
      }, 700);
    } catch (err) {
      console.error("Failed to save ward authority details:", err);
      setIsSaving(false);
    }
  };

  const auth = formData.authorities || {};
  const councillor = auth.councillor || {};
  const engineer = auth.executiveEngineer || {};
  const inspector = auth.sanitaryInspector || {};
  const helpline = auth.helpline || {};
  const office = auth.office || {};
  const depot = auth.depot || {};
  const police = auth.policeLiaison || {};

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in font-sans">
      <div className="relative w-full max-w-3xl overflow-hidden rounded-2xl bg-white shadow-2xl border border-line flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-line bg-surface px-6 py-4 text-white">
          <div className="flex items-center gap-2.5">
            <span className="rounded bg-accent px-2 py-0.5 font-mono text-xs font-bold text-ink">
              {formData.wardNumber}
            </span>
            <div>
              <h2 className="text-base font-bold text-white">Edit Ward Authorities & Directory</h2>
              <p className="text-xs text-white/60">
                {formData.name} · {formData.borough} ({formData.zone})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-1 text-white/70 hover:bg-white/10 hover:text-white transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Navigation Tabs */}
        <div className="flex border-b border-line bg-paper px-6 pt-2">
          <button
            onClick={() => setActiveTab("officials")}
            className={`flex items-center gap-1.5 border-b-2 px-4 py-2.5 text-xs font-bold transition-all ${
              activeTab === "officials"
                ? "border-accent text-accent-deep bg-white rounded-t-lg"
                : "border-transparent text-muted hover:text-ink"
            }`}
          >
            <User size={13} />
            Key Officials (Councillor & Engineers)
          </button>
          <button
            onClick={() => setActiveTab("contact")}
            className={`flex items-center gap-1.5 border-b-2 px-4 py-2.5 text-xs font-bold transition-all ${
              activeTab === "contact"
                ? "border-accent text-accent-deep bg-white rounded-t-lg"
                : "border-transparent text-muted hover:text-ink"
            }`}
          >
            <Phone size={13} />
            Helpline, Office & SWM Fleet
          </button>
          <button
            onClick={() => setActiveTab("landmarks")}
            className={`flex items-center gap-1.5 border-b-2 px-4 py-2.5 text-xs font-bold transition-all ${
              activeTab === "landmarks"
                ? "border-accent text-accent-deep bg-white rounded-t-lg"
                : "border-transparent text-muted hover:text-ink"
            }`}
          >
            <Landmark size={13} />
            Landmarks & Boundaries ({(formData.landmarks || []).length})
          </button>
        </div>

        {/* Content Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* TAB 1: OFFICIALS */}
          {activeTab === "officials" && (
            <div className="space-y-5">
              {/* Ward Identity & Classification */}
              <div className="rounded-xl border border-line bg-paper/30 p-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-ink mb-3">
                  Ward Identity & Regional Classification
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="text-[11px] font-semibold text-muted block mb-1">Ward Locality Name</label>
                    <input
                      type="text"
                      value={formData.name || ""}
                      onChange={(e) => updateField("name", e.target.value)}
                      className="w-full rounded-lg border border-line bg-white px-3 py-1.5 text-xs font-medium outline-none focus:border-ink"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-muted block mb-1">Borough</label>
                    <input
                      type="text"
                      value={formData.borough || ""}
                      onChange={(e) => updateField("borough", e.target.value)}
                      className="w-full rounded-lg border border-line bg-white px-3 py-1.5 text-xs font-medium outline-none focus:border-ink"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-muted block mb-1">Zone</label>
                    <select
                      value={formData.zone || ""}
                      onChange={(e) => updateField("zone", e.target.value)}
                      className="w-full rounded-lg border border-line bg-white px-3 py-1.5 text-xs font-medium outline-none focus:border-ink"
                    >
                      {ZONES.map((z) => (
                        <option key={z} value={z}>{z}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* 1. Councillor Form */}
              <div className="rounded-xl border border-line bg-white p-4 space-y-3">
                <div className="flex items-center gap-2 border-b border-line pb-2">
                  <User size={15} className="text-accent-deep" />
                  <h4 className="text-xs font-bold text-ink uppercase tracking-wider">
                    Elected Ward Councillor
                  </h4>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-semibold text-muted block mb-1">Councillor Name</label>
                    <input
                      type="text"
                      value={councillor.name || ""}
                      onChange={(e) => updateField("authorities.councillor.name", e.target.value)}
                      className="w-full rounded-lg border border-line bg-white px-3 py-1.5 text-xs outline-none focus:border-ink font-medium"
                      placeholder="e.g. Smt. Sushmita Bhattacharya"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-muted block mb-1">Designation & Committee</label>
                    <input
                      type="text"
                      value={councillor.designation || ""}
                      onChange={(e) => updateField("authorities.councillor.designation", e.target.value)}
                      className="w-full rounded-lg border border-line bg-white px-3 py-1.5 text-xs outline-none focus:border-ink"
                      placeholder="e.g. Ward Councillor & MMIC"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-muted block mb-1">Phone Number</label>
                    <input
                      type="text"
                      value={councillor.phone || ""}
                      onChange={(e) => updateField("authorities.councillor.phone", e.target.value)}
                      className="w-full rounded-lg border border-line bg-white px-3 py-1.5 text-xs outline-none focus:border-ink font-mono"
                      placeholder="+91 98301 00000"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-muted block mb-1">Official Email</label>
                    <input
                      type="email"
                      value={councillor.email || ""}
                      onChange={(e) => updateField("authorities.councillor.email", e.target.value)}
                      className="w-full rounded-lg border border-line bg-white px-3 py-1.5 text-xs outline-none focus:border-ink font-mono"
                      placeholder="councillor.ward@kmcgov.in"
                    />
                  </div>
                </div>
              </div>

              {/* 2. Executive Engineer (SWM) */}
              <div className="rounded-xl border border-line bg-white p-4 space-y-3">
                <div className="flex items-center gap-2 border-b border-line pb-2">
                  <Shield size={15} className="text-accent-deep" />
                  <h4 className="text-xs font-bold text-ink uppercase tracking-wider">
                    Executive Engineer (Solid Waste Management)
                  </h4>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-semibold text-muted block mb-1">Engineer Name</label>
                    <input
                      type="text"
                      value={engineer.name || ""}
                      onChange={(e) => updateField("authorities.executiveEngineer.name", e.target.value)}
                      className="w-full rounded-lg border border-line bg-white px-3 py-1.5 text-xs outline-none focus:border-ink font-medium"
                      placeholder="e.g. Er. Subrata Banerjee"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-muted block mb-1">Department</label>
                    <input
                      type="text"
                      value={engineer.department || "Solid Waste Management (SWM)"}
                      onChange={(e) => updateField("authorities.executiveEngineer.department", e.target.value)}
                      className="w-full rounded-lg border border-line bg-white px-3 py-1.5 text-xs outline-none focus:border-ink"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-muted block mb-1">Phone Number</label>
                    <input
                      type="text"
                      value={engineer.phone || ""}
                      onChange={(e) => updateField("authorities.executiveEngineer.phone", e.target.value)}
                      className="w-full rounded-lg border border-line bg-white px-3 py-1.5 text-xs outline-none focus:border-ink font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-muted block mb-1">Official Email</label>
                    <input
                      type="email"
                      value={engineer.email || ""}
                      onChange={(e) => updateField("authorities.executiveEngineer.email", e.target.value)}
                      className="w-full rounded-lg border border-line bg-white px-3 py-1.5 text-xs outline-none focus:border-ink font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* 3. Sanitary Inspector */}
              <div className="rounded-xl border border-line bg-white p-4 space-y-3">
                <div className="flex items-center gap-2 border-b border-line pb-2">
                  <Shield size={15} className="text-accent-deep" />
                  <h4 className="text-xs font-bold text-ink uppercase tracking-wider">
                    Chief Sanitary Inspector (CSI) / Health Officer
                  </h4>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-semibold text-muted block mb-1">Inspector / Health Officer Name</label>
                    <input
                      type="text"
                      value={inspector.name || ""}
                      onChange={(e) => updateField("authorities.sanitaryInspector.name", e.target.value)}
                      className="w-full rounded-lg border border-line bg-white px-3 py-1.5 text-xs outline-none focus:border-ink font-medium"
                      placeholder="e.g. Dr. Arindam Mukherjee"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-muted block mb-1">Phone Number</label>
                    <input
                      type="text"
                      value={inspector.phone || ""}
                      onChange={(e) => updateField("authorities.sanitaryInspector.phone", e.target.value)}
                      className="w-full rounded-lg border border-line bg-white px-3 py-1.5 text-xs outline-none focus:border-ink font-mono"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="text-[11px] font-semibold text-muted block mb-1">Official Email</label>
                    <input
                      type="email"
                      value={inspector.email || ""}
                      onChange={(e) => updateField("authorities.sanitaryInspector.email", e.target.value)}
                      className="w-full rounded-lg border border-line bg-white px-3 py-1.5 text-xs outline-none focus:border-ink font-mono"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: CONTACT, HELPLINE & DEPOT */}
          {activeTab === "contact" && (
            <div className="space-y-5">
              {/* Emergency Helpline Strip */}
              <div className="rounded-xl border border-warning/40 bg-warning/10 p-4 space-y-3">
                <div className="flex items-center gap-2 border-b border-warning/30 pb-2">
                  <Phone size={15} className="text-warning" />
                  <h4 className="text-xs font-bold text-ink uppercase tracking-wider">
                    24x7 Ward Emergency Control Room & Helplines
                  </h4>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-semibold text-muted block mb-1">
                      Control Room 24/7 Telephone
                    </label>
                    <input
                      type="text"
                      value={helpline.controlRoom || ""}
                      onChange={(e) => updateField("authorities.helpline.controlRoom", e.target.value)}
                      className="w-full rounded-lg border border-line bg-white px-3 py-1.5 text-xs font-mono font-medium outline-none focus:border-ink"
                      placeholder="1800-345-5620 / 033-2286-1000"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-muted block mb-1">
                      Citizen WhatsApp Grievance Number
                    </label>
                    <input
                      type="text"
                      value={helpline.whatsapp || ""}
                      onChange={(e) => updateField("authorities.helpline.whatsapp", e.target.value)}
                      className="w-full rounded-lg border border-line bg-white px-3 py-1.5 text-xs font-mono font-medium outline-none focus:border-ink"
                      placeholder="+91 90510 22334"
                    />
                  </div>
                </div>
              </div>

              {/* Ward Office Address & Hours */}
              <div className="rounded-xl border border-line bg-white p-4 space-y-3">
                <div className="flex items-center gap-2 border-b border-line pb-2">
                  <Building size={15} className="text-accent-deep" />
                  <h4 className="text-xs font-bold text-ink uppercase tracking-wider">
                    Ward Office Physical Details
                  </h4>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="md:col-span-2">
                    <label className="text-[11px] font-semibold text-muted block mb-1">Ward Office Address</label>
                    <input
                      type="text"
                      value={office.address || ""}
                      onChange={(e) => updateField("authorities.office.address", e.target.value)}
                      className="w-full rounded-lg border border-line bg-white px-3 py-1.5 text-xs outline-none focus:border-ink"
                      placeholder="e.g. 12/1 Park Street, Kolkata 700016"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-muted block mb-1">Public Operating Hours</label>
                    <input
                      type="text"
                      value={office.hours || ""}
                      onChange={(e) => updateField("authorities.office.hours", e.target.value)}
                      className="w-full rounded-lg border border-line bg-white px-3 py-1.5 text-xs outline-none focus:border-ink"
                      placeholder="08:00 AM – 06:00 PM"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-muted block mb-1">Office Landline</label>
                    <input
                      type="text"
                      value={office.phone || ""}
                      onChange={(e) => updateField("authorities.office.phone", e.target.value)}
                      className="w-full rounded-lg border border-line bg-white px-3 py-1.5 text-xs outline-none focus:border-ink font-mono"
                      placeholder="033-2287-4590"
                    />
                  </div>
                </div>
              </div>

              {/* Sanitation Depot & Fleet Capacity */}
              <div className="rounded-xl border border-line bg-white p-4 space-y-3">
                <div className="flex items-center gap-2 border-b border-line pb-2">
                  <Truck size={15} className="text-accent-deep" />
                  <h4 className="text-xs font-bold text-ink uppercase tracking-wider">
                    Solid Waste Management Depot & Vehicle Fleet
                  </h4>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-semibold text-muted block mb-1">Compactor Station / Depot Name</label>
                    <input
                      type="text"
                      value={depot.name || ""}
                      onChange={(e) => updateField("authorities.depot.name", e.target.value)}
                      className="w-full rounded-lg border border-line bg-white px-3 py-1.5 text-xs outline-none focus:border-ink"
                      placeholder="e.g. Park Circus Compactor Station"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-muted block mb-1">Depot Supervisor</label>
                    <input
                      type="text"
                      value={depot.supervisor || ""}
                      onChange={(e) => updateField("authorities.depot.supervisor", e.target.value)}
                      className="w-full rounded-lg border border-line bg-white px-3 py-1.5 text-xs outline-none focus:border-ink"
                      placeholder="e.g. Sri Dilip Sardar"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="text-[11px] font-semibold text-muted block mb-1">
                      Assigned Waste Vehicles & Drone Capacity
                    </label>
                    <input
                      type="text"
                      value={depot.fleetCapacity || ""}
                      onChange={(e) => updateField("authorities.depot.fleetCapacity", e.target.value)}
                      className="w-full rounded-lg border border-line bg-white px-3 py-1.5 text-xs outline-none focus:border-ink font-mono"
                      placeholder="10 Battery Tippers, 3 Hydraulic Compactors, 1 Drone Unit"
                    />
                  </div>
                </div>
              </div>

              {/* Police Liaison */}
              <div className="rounded-xl border border-line bg-white p-4 space-y-3">
                <div className="flex items-center gap-2 border-b border-line pb-2">
                  <Shield size={15} className="text-muted" />
                  <h4 className="text-xs font-bold text-ink uppercase tracking-wider">
                    Enforcement Police Station
                  </h4>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-semibold text-muted block mb-1">Police Station Name</label>
                    <input
                      type="text"
                      value={police.station || ""}
                      onChange={(e) => updateField("authorities.policeLiaison.station", e.target.value)}
                      className="w-full rounded-lg border border-line bg-white px-3 py-1.5 text-xs outline-none focus:border-ink"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-muted block mb-1">Officer in Charge (OC)</label>
                    <input
                      type="text"
                      value={police.officer || ""}
                      onChange={(e) => updateField("authorities.policeLiaison.officer", e.target.value)}
                      className="w-full rounded-lg border border-line bg-white px-3 py-1.5 text-xs outline-none focus:border-ink"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: LANDMARKS & JURISDICTION */}
          {activeTab === "landmarks" && (
            <div className="space-y-4">
              <div className="rounded-xl border border-line bg-white p-4">
                <h4 className="text-xs font-bold text-ink uppercase tracking-wider mb-2">
                  Add New Landmark to this Ward
                </h4>
                <div className="flex flex-wrap gap-2">
                  <input
                    type="text"
                    value={newLandmarkName}
                    onChange={(e) => setNewLandmarkName(e.target.value)}
                    placeholder="Landmark name (e.g. National Library, South City Mall)..."
                    className="flex-1 min-w-[200px] rounded-lg border border-line bg-white px-3 py-1.5 text-xs outline-none focus:border-ink"
                  />
                  <select
                    value={newLandmarkType}
                    onChange={(e) => setNewLandmarkType(e.target.value)}
                    className="rounded-lg border border-line bg-white px-2 py-1.5 text-xs outline-none focus:border-ink"
                  >
                    <option value="Heritage Site">Heritage Site</option>
                    <option value="Education Hub">Education Hub</option>
                    <option value="Hospital Hub">Hospital Hub</option>
                    <option value="Commercial Center">Commercial Center</option>
                    <option value="Public Park">Public Park</option>
                    <option value="Transit Terminal">Transit Terminal</option>
                  </select>
                  <button
                    type="button"
                    onClick={handleAddLandmark}
                    className="inline-flex items-center gap-1 rounded-lg bg-ink px-3 py-1.5 text-xs font-semibold text-white hover:bg-surface2 transition-colors"
                  >
                    <Plus size={13} /> Add
                  </button>
                </div>
              </div>

              {/* Landmarks List */}
              <div className="space-y-2">
                <p className="text-xs font-bold uppercase tracking-wider text-muted">
                  Registered Ward Landmarks (Used for instant map jump)
                </p>
                <div className="space-y-1.5">
                  {(formData.landmarks || []).map((lm) => (
                    <div
                      key={lm.id || lm.name}
                      className="flex items-center justify-between rounded-lg border border-line bg-paper/50 px-3 py-2 text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <Landmark size={14} className="text-accent-deep" />
                        <span className="font-semibold text-ink">{lm.name}</span>
                        <span className="rounded bg-black/5 px-1.5 py-0.5 text-[10px] text-muted">
                          {lm.type || "Landmark"}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveLandmark(lm.id || lm.name)}
                        className="text-muted hover:text-danger transition-colors p-1"
                        title="Remove Landmark"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  ))}

                  {(!formData.landmarks || formData.landmarks.length === 0) && (
                    <p className="text-xs text-muted text-center py-4">No landmarks listed for this ward.</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Footer Controls */}
          <div className="border-t border-line pt-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              {saveSuccess && (
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-accent-deep">
                  <CheckCircle size={14} /> Saved successfully!
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-pill border border-line px-4 py-2 text-xs font-medium text-muted hover:text-ink hover:bg-paper transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="inline-flex items-center gap-1.5 rounded-pill bg-ink px-5 py-2 text-xs font-bold text-white hover:bg-surface2 transition-all shadow-md disabled:opacity-50"
              >
                <Save size={13} />
                {isSaving ? "Saving..." : "Save Ward Authorities"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
