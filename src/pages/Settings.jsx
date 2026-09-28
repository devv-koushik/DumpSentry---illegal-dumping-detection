import { useState } from "react";
import { User, Bell, ShieldCheck, Cpu, SlidersHorizontal } from "lucide-react";
import PageHeader from "../components/PageHeader";
import { AUTHORITIES } from "../data/authorities";

const TABS = [
  { key: "profile", label: "Profile", icon: User },
  { key: "notifications", label: "Notifications", icon: Bell },
  { key: "authority", label: "Authority Configuration", icon: ShieldCheck },
  { key: "ai", label: "AI Configuration", icon: Cpu },
  { key: "system", label: "System Preferences", icon: SlidersHorizontal },
];

export default function Settings() {
  const [tab, setTab] = useState("profile");

  return (
    <div>
      <PageHeader title="Settings" description="System configuration, AI detection thresholds, and authority contact routing." />

      <div className="grid gap-6 lg:grid-cols-[220px,1fr]">
        <nav className="flex gap-2 overflow-x-auto lg:flex-col lg:overflow-visible" aria-label="Settings sections">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex flex-shrink-0 items-center gap-2.5 rounded-lg px-3.5 py-2.5 text-left text-sm font-medium transition-colors ${
                tab === t.key ? "bg-ink text-white" : "text-muted hover:bg-ink/5 hover:text-ink"
              }`}
            >
              <t.icon size={15} /> {t.label}
            </button>
          ))}
        </nav>

        <div className="card p-6">
          {tab === "profile" && <Profile />}
          {tab === "notifications" && <Notifications />}
          {tab === "authority" && <AuthorityConfig />}
          {tab === "ai" && <AIConfig />}
          {tab === "system" && <SystemPrefs />}
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium text-muted">{label}</span>
      {children}
    </label>
  );
}
const inputClass = "w-full rounded-lg border border-ink/10 bg-paper px-3.5 py-2.5 text-sm outline-none focus:border-ink/30";

function Toggle({ label, description, defaultChecked = true }) {
  const [checked, setChecked] = useState(defaultChecked);
  return (
    <div className="flex items-center justify-between border-b border-line py-4 last:border-0">
      <div>
        <p className="text-sm font-medium text-ink">{label}</p>
        {description && <p className="text-xs text-muted">{description}</p>}
      </div>
      <button
        onClick={() => setChecked((v) => !v)}
        aria-pressed={checked}
        aria-label={label}
        className={`h-6 w-11 flex-shrink-0 rounded-pill p-0.5 transition-colors ${checked ? "bg-ink" : "bg-ink/15"}`}
      >
        <span className={`block h-5 w-5 rounded-full bg-white transition-transform ${checked ? "translate-x-5" : "translate-x-0"}`} />
      </button>
    </div>
  );
}

function Profile() {
  return (
    <div className="max-w-md space-y-4">
      <p className="mb-2 font-medium text-ink">Profile</p>
      <Field label="Full Name"><input defaultValue="Ananya Kulkarni" className={inputClass} /></Field>
      <Field label="Email"><input defaultValue="ananya@dumpsentry.ai" className={inputClass} /></Field>
      <Field label="Role"><input defaultValue="Operations Analyst" className={inputClass} /></Field>
      <button className="btn-primary !py-2 text-sm">Save Changes</button>
    </div>
  );
}

function Notifications() {
  return (
    <div className="max-w-lg">
      <p className="mb-2 font-medium text-ink">Notifications</p>
      <Toggle label="New suspected dumping detected" description="Notify me when confidence is 80% or higher." />
      <Toggle label="Alert dispatch failures" description="Notify me if an authority notification fails to send." />
      <Toggle label="Weekly summary report" description="Email a summary of detections every Monday." defaultChecked={false} />
    </div>
  );
}

function AuthorityConfig() {
  return (
    <div>
      <p className="mb-4 font-medium text-ink">Authority Configuration</p>
      <div className="space-y-3">
        {AUTHORITIES.map((a) => (
          <div key={a.context} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-line p-3.5">
            <div>
              <p className="text-sm font-medium text-ink">{a.context}</p>
              <p className="text-xs text-muted">{a.authority}</p>
            </div>
            <input defaultValue={a.email} className={`${inputClass} max-w-xs`} />
          </div>
        ))}
      </div>
    </div>
  );
}

function AIConfig() {
  return (
    <div className="max-w-md space-y-4">
      <p className="mb-2 font-medium text-ink">AI Configuration</p>
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

function SystemPrefs() {
  return (
    <div className="max-w-md space-y-4">
      <p className="mb-2 font-medium text-ink">System Preferences</p>
      <Field label="Default map center">
        <input defaultValue="Kolkata, West Bengal" className={inputClass} />
      </Field>
      <Field label="Timezone">
        <select className={inputClass} defaultValue="ist">
          <option value="ist">Indian Standard Time (IST)</option>
          <option value="utc">UTC</option>
        </select>
      </Field>
      <Toggle label="Dark mode" description="Not implemented in this mock UI." defaultChecked={false} />
    </div>
  );
}
