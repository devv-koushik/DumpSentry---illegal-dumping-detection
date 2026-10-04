import { useState, useEffect } from "react";
import {
  User,
  Bell,
  ShieldCheck,
  Cpu,
  SlidersHorizontal,
  Search,
  Edit3,
  Plus,
  RefreshCw,
} from "lucide-react";
import PageHeader from "../components/PageHeader";
import AdminGuard from "../components/AdminGuard";
import EditWardAuthorityModal from "../components/EditWardAuthorityModal";
import { ZONES } from "../data/wardAuthorities";
import {
  getStoredWards,
  subscribeWards,
  updateWard,
  createNewWard,
  resetWardsToDefaults,
} from "../services/wardService";

const TABS = [
  { key: "profile", label: "Profile", icon: User },
  { key: "authority", label: "Ward & Authority Directory", icon: ShieldCheck },
  { key: "notifications", label: "Notifications", icon: Bell },
  { key: "ai", label: "AI Configuration", icon: Cpu },
  { key: "system", label: "System Preferences", icon: SlidersHorizontal },
];

export default function Settings() {
  const [tab, setTab] = useState("authority");

  return (
    <AdminGuard
      action="manage municipal authorities, geospatial routing rules, and system configurations"
      title="System Settings & Authority Configuration"
      description="Only authenticated administrators can modify authority contact routing, AI detection thresholds, notifications, and system preferences."
    >
      <div>
        <PageHeader
          title="Settings"
          description="System configuration, ward-by-ward authorities directory, and AI routing rules."
        />

        <div className="grid gap-6 lg:grid-cols-[220px,1fr]">
          <nav className="flex gap-2 overflow-x-auto lg:flex-col lg:overflow-visible" aria-label="Settings sections">
            {TABS.map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`flex flex-shrink-0 items-center gap-2.5 rounded-lg px-3.5 py-2.5 text-left text-sm font-medium transition-colors ${
                  tab === t.key ? "bg-ink text-white font-semibold" : "text-muted hover:bg-ink/5 hover:text-ink"
                }`}
              >
                <t.icon size={15} /> {t.label}
              </button>
            ))}
          </nav>

          <div className="rounded-card border border-ink/10 bg-white p-6 shadow-card">
            {tab === "profile" && <ProfileConfig />}
            {tab === "notifications" && <NotificationsConfig />}
            {tab === "authority" && <WardAuthorityManager />}
            {tab === "ai" && <AIConfig />}
            {tab === "system" && <SystemConfig />}
          </div>
        </div>
      </div>
    </AdminGuard>
  );
}

const inputClass =
  "w-full rounded-pill border border-line bg-paper px-4 py-2 text-sm text-ink outline-none transition-colors focus:border-ink focus:bg-white";

function Field({ label, children }) {
  return (
    <label className="block text-sm">
      <span className="mb-1 block font-medium text-ink">{label}</span>
      {children}
    </label>
  );
}

function Toggle({ label, description, defaultChecked = true }) {
  const [checked, setChecked] = useState(defaultChecked);
  return (
    <div className="flex items-center justify-between gap-4 py-2">
      <div>
        <p className="text-sm font-medium text-ink">{label}</p>
        {description && <p className="text-xs text-muted">{description}</p>}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => setChecked(!checked)}
        className={`relative h-6 w-11 flex-shrink-0 rounded-pill transition-colors ${
          checked ? "bg-accent-deep" : "bg-line"
        }`}
      >
        <span
          className={`block h-4 w-4 rounded-full bg-white transition-transform ${
            checked ? "translate-x-6" : "translate-x-1"
          }`}
        />
      </button>
    </div>
  );
}

function ProfileConfig() {
  return (
    <div className="max-w-md space-y-4">
      <p className="mb-2 font-medium text-ink">Account Profile</p>
      <Field label="Full name">
        <input defaultValue="Command Officer" className={inputClass} />
      </Field>
      <Field label="Email address">
        <input type="email" defaultValue="officer@dumpsentry.gov.in" className={inputClass} />
      </Field>
      <Field label="Jurisdiction">
        <input defaultValue="Kolkata Metropolitan Area" className={inputClass} readOnly />
      </Field>
      <Field label="Department">
        <input defaultValue="Solid Waste Management & Vigilance Directorate" className={inputClass} readOnly />
      </Field>
      <button className="btn btn-primary mt-2">Save Profile</button>
    </div>
  );
}

function NotificationsConfig() {
  return (
    <div className="max-w-md space-y-3">
      <p className="mb-2 font-medium text-ink">Alert Notifications</p>
      <Toggle label="New suspected dumping detected" description="Notify me when confidence is 80% or higher." />
      <Toggle label="Alert dispatch failures" description="Notify me if an authority notification fails to send." />
      <Toggle label="Weekly summary report" description="Email a summary of detections every Monday." defaultChecked={false} />
      <Toggle label="Ward Councillor auto-routing" description="CC the local ward councillor on critical violations." defaultChecked={true} />
    </div>
  );
}

/**
 * Full-featured Ward-by-Ward Authorities Manager
 */
function WardAuthorityManager() {
  const [subTab, setSubTab] = useState("wards"); // 'wards' | 'rules'
  const [wards, setWards] = useState(() => getStoredWards());
  const [zoneFilter, setZoneFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [editingWard, setEditingWard] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [contextRules, setContextRules] = useState([]);

  useEffect(() => {
    const unsub = subscribeWards((updated) => setWards(updated));
    return unsub;
  }, []);

  useEffect(() => {
    import("../services/api").then(({ fetchRules }) => {
      fetchRules().then((rules) => {
        if (Array.isArray(rules)) setContextRules(rules);
      }).catch(console.error);
    });
  }, []);

  const filteredWards = wards.filter((w) => {
    const matchesZone = zoneFilter === "All" || w.zone === zoneFilter;
    const q = search.toLowerCase();
    const matchesSearch =
      !search ||
      w.wardNumber.toLowerCase().includes(q) ||
      w.name.toLowerCase().includes(q) ||
      w.borough.toLowerCase().includes(q) ||
      w.authorities?.councillor?.name?.toLowerCase().includes(q) ||
      w.authorities?.executiveEngineer?.name?.toLowerCase().includes(q);
    return matchesZone && matchesSearch;
  });

  const handleEdit = (ward) => {
    setEditingWard(ward);
    setIsModalOpen(true);
  };

  const handleSave = async (id, data) => {
    await updateWard(id, data);
  };

  const handleReset = () => {
    if (window.confirm("Reset all wards and authorities to default official municipal records?")) {
      const defs = resetWardsToDefaults();
      setWards(defs);
    }
  };

  const handleAddNew = () => {
    const newNumber = prompt("Enter Ward Number (e.g. Ward 99):", "Ward 99");
    if (!newNumber) return;
    const newName = prompt("Enter Locality Name (e.g. Kasba South):", "Kasba South");
    if (!newName) return;

    const created = createNewWard({
      wardNumber: newNumber,
      name: newName,
      borough: "Borough X",
      zone: "South Kolkata",
      color: "#2FCB8A",
      center: [22.51, 88.38],
      authorities: {
        councillor: { name: "Civic Councillor", phone: "+91 98300 00000", email: "councillor@kmcgov.in" },
        executiveEngineer: { name: "Executive Engineer SWM", phone: "+91 94330 00000", email: "ee.swm@kmcgov.in" },
        helpline: { controlRoom: "1800-345-5620", whatsapp: "+91 90510 00000" },
      },
    });
    setEditingWard(created);
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-4">
      {/* Sub tabs */}
      <div className="flex items-center justify-between border-b border-line pb-3">
        <div className="flex gap-2">
          <button
            onClick={() => setSubTab("wards")}
            className={`rounded-pill px-3.5 py-1.5 text-xs font-bold transition-all ${
              subTab === "wards"
                ? "bg-ink text-white shadow-xs"
                : "border border-line bg-paper text-muted hover:text-ink"
            }`}
          >
            Ward-by-Ward Authorities ({wards.length})
          </button>
          <button
            onClick={() => setSubTab("rules")}
            className={`rounded-pill px-3.5 py-1.5 text-xs font-bold transition-all ${
              subTab === "rules"
                ? "bg-ink text-white shadow-xs"
                : "border border-line bg-paper text-muted hover:text-ink"
            }`}
          >
            AI Context-Based Routing Rules
          </button>
        </div>

        {subTab === "wards" && (
          <div className="flex items-center gap-2">
            <button
              onClick={handleAddNew}
              className="inline-flex items-center gap-1 rounded-pill bg-ink px-3 py-1 text-xs font-semibold text-white hover:bg-surface2 transition-colors"
            >
              <Plus size={12} /> Add Ward
            </button>
            <button
              onClick={handleReset}
              title="Reset to official defaults"
              className="flex h-7 w-7 items-center justify-center rounded-full border border-line bg-white text-muted hover:text-ink hover:bg-paper"
            >
              <RefreshCw size={12} />
            </button>
          </div>
        )}
      </div>

      {subTab === "wards" ? (
        <div className="space-y-3">
          {/* Filter Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="relative min-w-[220px] max-w-xs flex-1">
              <Search size={13} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search ward, councillor, borough..."
                className="w-full rounded-pill border border-line bg-paper py-1.5 pl-8 pr-3 text-xs outline-none focus:border-ink focus:bg-white"
              />
            </div>

            <div className="flex flex-wrap gap-1">
              <button
                onClick={() => setZoneFilter("All")}
                className={`rounded-pill px-2.5 py-1 text-[11px] font-medium transition-colors ${
                  zoneFilter === "All"
                    ? "bg-ink text-white"
                    : "border border-line bg-paper text-muted hover:text-ink"
                }`}
              >
                All Zones
              </button>
              {ZONES.map((z) => (
                <button
                  key={z}
                  onClick={() => setZoneFilter(z)}
                  className={`rounded-pill px-2.5 py-1 text-[11px] font-medium transition-colors ${
                    zoneFilter === z
                      ? "bg-ink text-white"
                      : "border border-line bg-paper text-muted hover:text-ink"
                  }`}
                >
                  {z}
                </button>
              ))}
            </div>
          </div>

          {/* Wards Directory Table / List */}
          <div className="overflow-x-auto rounded-xl border border-line">
            <table className="w-full text-left text-xs">
              <thead className="bg-paper border-b border-line text-[11px] uppercase tracking-wider font-semibold text-muted">
                <tr>
                  <th className="px-3 py-2.5">Ward & Locality</th>
                  <th className="px-3 py-2.5">Borough / Zone</th>
                  <th className="px-3 py-2.5">Ward Councillor</th>
                  <th className="px-3 py-2.5">SWM Executive Engineer</th>
                  <th className="px-3 py-2.5">24/7 Helpline</th>
                  <th className="px-3 py-2.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line bg-white">
                {filteredWards.map((w) => {
                  const auth = w.authorities || {};
                  return (
                    <tr key={w.id} className="hover:bg-paper/40 transition-colors">
                      <td className="px-3 py-2.5">
                        <div className="flex items-center gap-2">
                          <span
                            className="h-2 w-2 rounded-full"
                            style={{ backgroundColor: w.color || "#2FCB8A" }}
                          />
                          <div>
                            <span className="font-mono font-bold text-ink">{w.wardNumber}</span>
                            <p className="font-semibold text-ink text-xs">{w.name}</p>
                          </div>
                        </div>
                      </td>

                      <td className="px-3 py-2.5">
                        <p className="font-medium text-ink">{w.borough}</p>
                        <p className="text-[10px] text-muted">{w.zone}</p>
                      </td>

                      <td className="px-3 py-2.5">
                        <p className="font-semibold text-ink">{auth.councillor?.name || "Civic Desk"}</p>
                        <p className="text-[10px] text-muted font-mono">{auth.councillor?.phone || "—"}</p>
                      </td>

                      <td className="px-3 py-2.5">
                        <p className="font-medium text-ink">{auth.executiveEngineer?.name || "—"}</p>
                        <p className="text-[10px] text-muted truncate max-w-[160px] font-mono">
                          {auth.executiveEngineer?.email || "—"}
                        </p>
                      </td>

                      <td className="px-3 py-2.5 font-mono text-[11px] text-accent-deep font-semibold">
                        {auth.helpline?.controlRoom?.split("/")[0] || "1800-345-5620"}
                      </td>

                      <td className="px-3 py-2.5 text-right">
                        <button
                          onClick={() => handleEdit(w)}
                          className="inline-flex items-center gap-1 rounded-pill bg-paper px-2.5 py-1 text-[11px] font-bold text-ink hover:bg-ink hover:text-white transition-all border border-line"
                        >
                          <Edit3 size={11} /> Edit
                        </button>
                      </td>
                    </tr>
                  );
                })}

                {filteredWards.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-6 text-center text-xs text-muted">
                      No wards match the current filter.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Sub Tab: Context-based Rules */
        <div className="space-y-3">
          <p className="text-xs text-muted">
            Configure fallback dispatch authorities when dumping occurs near specific facility contexts.
          </p>
          <div className="space-y-2">
            {contextRules.map((rule) => (
              <div key={rule.id || rule._id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-line p-3">
                <div>
                  <p className="text-sm font-bold text-ink">{rule.contextType.replace(/_/g, " ")}</p>
                  <p className="text-xs text-muted">{rule.authority?.name} ({rule.authority?.type})</p>
                </div>
                <input defaultValue={rule.authority?.email || ""} className={`${inputClass} max-w-xs text-xs font-mono`} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Edit Ward Modal */}
      {isModalOpen && (
        <EditWardAuthorityModal
          key={editingWard?.id || "settings-modal"}
          ward={editingWard}
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSave={handleSave}
        />
      )}
    </div>
  );
}

function AIConfig() {
  return (
    <div className="max-w-md space-y-4">
      <p className="mb-2 font-medium text-ink">AI Detection Engine</p>
      <Field label="Minimum confidence to flag as Suspected Illegal">
        <input type="range" min="50" max="99" defaultValue="80" className="w-full accent-accent" />
      </Field>
      <Field label="Detection model version">
        <select className={inputClass} defaultValue="yolo11n">
          <option value="yolo11n">YOLOv11-Nano (Real-time Aerial Inference, 640px)</option>
          <option value="yolo11s">YOLOv11-Small (Enhanced Feature Resolution)</option>
          <option value="custom">DumpSentry Custom Fine-tuned (best.pt)</option>
        </select>
      </Field>
      <Toggle label="Auto-verify above 95% confidence" description="Skip manual review for very high-confidence detections." defaultChecked={false} />
    </div>
  );
}

function SystemConfig() {
  return (
    <div className="max-w-md space-y-4">
      <p className="mb-2 font-medium text-ink">System Preferences</p>
      <Field label="Default Map Center Lat/Lng">
        <input defaultValue="22.5600, 88.3900 (Kolkata Metropolitan Area)" className={inputClass} readOnly />
      </Field>
      <Field label="Map Tile Provider">
        <select className={inputClass} defaultValue="osm">
          <option value="osm">OpenStreetMap Standard</option>
          <option value="satellite">ESRI World Imagery (Satellite)</option>
        </select>
      </Field>
      <Toggle label="Auto-refresh detections every 30s" defaultChecked={true} />
    </div>
  );
}
