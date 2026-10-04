import { useState } from "react";
import {
  Shield,
  Phone,
  Mail,
  MapPin,
  Clock,
  Truck,
  Building2,
  Landmark,
  Edit3,
  MessageSquare,
} from "lucide-react";

export default function WardAuthorityCard({
  ward,
  onEdit = () => { },
  onSelectLandmark = () => { },
  isAdmin = false,
}) {
  const [copied, setCopied] = useState("");

  if (!ward) return null;

  const handleCopy = (text, label) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(""), 2000);
  };

  const auth = ward.authorities || {};
  const councillor = auth.councillor || {};
  const engineer = auth.executiveEngineer || {};
  const inspector = auth.sanitaryInspector || {};
  const helpline = auth.helpline || {};
  const office = auth.office || {};
  const depot = auth.depot || {};
  const police = auth.policeLiaison || {};

  return (
    <div className="flex flex-col rounded-card border border-ink/10 bg-white shadow-card overflow-hidden">
      {/* ── Ward Header Banner ── */}
      <div
        className="p-4 text-white relative overflow-hidden"
        style={{
          background: `linear-gradient(135deg, #10201A 0%, #1f3029 100%)`,
        }}
      >
        <div className="flex items-start justify-between gap-3 relative z-10">
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded bg-accent px-2 py-0.5 font-mono text-xs font-bold text-ink">
                {ward.wardNumber}
              </span>
              <span className="text-[11px] font-semibold uppercase tracking-wider text-white/70">
                {ward.borough}
              </span>
              <span className="text-[11px] font-medium text-white/50">· {ward.zone}</span>
            </div>
            <h2 className="mt-1 text-lg font-bold text-white leading-snug">
              {ward.name}
            </h2>
          </div>

          {isAdmin && (
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => onEdit(ward)}
                className="flex items-center gap-1.5 rounded-pill bg-accent/20 px-3 py-1.5 text-xs font-semibold text-accent hover:bg-accent hover:text-ink transition-all shadow-xs"
              >
                <Edit3 size={13} />
                <span>Edit Authority</span>
              </button>
            </div>
          )}
        </div>

        {/* Ward Quick Stats Grid */}
        <div className="mt-3.5 grid grid-cols-4 gap-2 pt-3 border-t border-white/10 text-center">
          <div className="rounded-lg bg-white/5 p-1.5">
            <p className="text-[10px] text-white/60">Area</p>
            <p className="font-mono text-xs font-bold text-white">{ward.stats?.areaSqKm || "2.1"} km²</p>
          </div>
          <div className="rounded-lg bg-white/5 p-1.5">
            <p className="text-[10px] text-white/60">Population</p>
            <p className="font-mono text-xs font-bold text-white">{ward.stats?.population || "45k"}</p>
          </div>
          <div className="rounded-lg bg-white/5 p-1.5">
            <p className="text-[10px] text-white/60">Active Alerts</p>
            <p className="font-mono text-xs font-bold text-warning">{ward.stats?.activeHotspots || 0}</p>
          </div>
          <div className="rounded-lg bg-white/5 p-1.5">
            <p className="text-[10px] text-white/60">Resolution</p>
            <p className="font-mono text-xs font-bold text-accent">{ward.stats?.resolutionRate || 95}%</p>
          </div>
        </div>
      </div>

      {/* ── 24/7 Emergency Dispatch Strip ── */}
      <div className="bg-warning/10 border-y border-warning/20 px-4 py-2.5 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          <span className="flex h-2 w-2 rounded-full bg-warning animate-pulse" />
          <span className="font-semibold text-ink">Ward SWM Hotline:</span>
          <a
            href={`tel:${helpline.controlRoom?.split("/")[0]?.trim() || "1800-345-5620"}`}
            className="font-mono font-bold text-accent-deep hover:underline"
          >
            {helpline.controlRoom || "1800-345-5620"}
          </a>
        </div>

        {helpline.whatsapp && (
          <a
            href={`https://wa.me/${helpline.whatsapp.replace(/[^0-9]/g, "")}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 rounded bg-accent-deep px-2 py-0.5 text-[11px] font-bold text-white hover:bg-emerald-700 transition-colors"
          >
            <MessageSquare size={11} /> WhatsApp Grievance
          </a>
        )}
      </div>

      {/* ── Accordion / Content Area ── */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 max-h-[480px]">
        {/* 1. KEY ADMINISTRATIVE AUTHORITIES */}
        <div>
          <h4 className="text-[11px] font-bold uppercase tracking-wider text-muted mb-2.5 flex items-center gap-1.5">
            <Shield size={13} className="text-accent-deep" />
            Key Municipal Authorities
          </h4>

          <div className="space-y-2.5">
            {/* Councillor */}
            <div className="rounded-xl border border-line bg-paper/50 p-3 hover:border-ink/20 transition-all">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="rounded bg-black/5 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-muted">
                    Ward Councillor
                  </span>
                  <h5 className="font-bold text-sm text-ink mt-0.5">{councillor.name || "Designated Councillor"}</h5>
                  <p className="text-[11px] text-muted">{councillor.designation || "Representative"}</p>
                </div>
                {councillor.party && (
                  <span className="rounded-pill bg-white px-2 py-0.5 text-[10px] font-medium text-ink shadow-xs border border-line">
                    {councillor.party}
                  </span>
                )}
              </div>

              <div className="mt-2.5 flex flex-wrap items-center gap-2 pt-2 border-t border-line text-xs">
                {councillor.phone && (
                  <a
                    href={`tel:${councillor.phone}`}
                    className="inline-flex items-center gap-1 font-mono font-medium text-ink hover:text-accent-deep"
                  >
                    <Phone size={12} className="text-accent-deep" /> {councillor.phone}
                  </a>
                )}
                {councillor.email && (
                  <a
                    href={`mailto:${councillor.email}`}
                    className="inline-flex items-center gap-1 font-mono text-[11px] text-muted hover:text-ink truncate max-w-[200px]"
                  >
                    <Mail size={12} className="text-muted" /> {councillor.email}
                  </a>
                )}
              </div>
            </div>

            {/* SWM Executive Engineer */}
            <div className="rounded-xl border border-line bg-paper/50 p-3 hover:border-ink/20 transition-all">
              <div>
                <span className="rounded bg-black/5 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-muted">
                  Executive Engineer (Solid Waste Management)
                </span>
                <h5 className="font-bold text-sm text-ink mt-0.5">{engineer.name || "Er. Municipal Engineer"}</h5>
                <p className="text-[11px] text-muted">{engineer.department || "Solid Waste Management (SWM)"}</p>
              </div>

              <div className="mt-2.5 flex flex-wrap items-center gap-2 pt-2 border-t border-line text-xs">
                {engineer.phone && (
                  <a
                    href={`tel:${engineer.phone}`}
                    className="inline-flex items-center gap-1 font-mono font-medium text-ink hover:text-accent-deep"
                  >
                    <Phone size={12} className="text-accent-deep" /> {engineer.phone}
                  </a>
                )}
                {engineer.email && (
                  <a
                    href={`mailto:${engineer.email}`}
                    className="inline-flex items-center gap-1 font-mono text-[11px] text-muted hover:text-ink truncate max-w-[200px]"
                  >
                    <Mail size={12} className="text-muted" /> {engineer.email}
                  </a>
                )}
              </div>
            </div>

            {/* Chief Sanitary Inspector */}
            <div className="rounded-xl border border-line bg-paper/50 p-3 hover:border-ink/20 transition-all">
              <div>
                <span className="rounded bg-black/5 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-muted">
                  Chief Sanitary Inspector (CSI) / Health Officer
                </span>
                <h5 className="font-bold text-sm text-ink mt-0.5">{inspector.name || "Dr. Health Officer"}</h5>
                <p className="text-[11px] text-muted">{inspector.designation || "Public Health & Waste Surveillance"}</p>
              </div>

              <div className="mt-2.5 flex flex-wrap items-center gap-2 pt-2 border-t border-line text-xs">
                {inspector.phone && (
                  <a
                    href={`tel:${inspector.phone}`}
                    className="inline-flex items-center gap-1 font-mono font-medium text-ink hover:text-accent-deep"
                  >
                    <Phone size={12} className="text-accent-deep" /> {inspector.phone}
                  </a>
                )}
                {inspector.email && (
                  <a
                    href={`mailto:${inspector.email}`}
                    className="inline-flex items-center gap-1 font-mono text-[11px] text-muted hover:text-ink truncate max-w-[200px]"
                  >
                    <Mail size={12} className="text-muted" /> {inspector.email}
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* 2. CIVIC DESK & OPERATIONAL DEPOT */}
        <div>
          <h4 className="text-[11px] font-bold uppercase tracking-wider text-muted mb-2.5 flex items-center gap-1.5">
            <Building2 size={13} className="text-accent-deep" />
            Ward Office & SWM Depot Fleet
          </h4>

          <div className="space-y-2 text-xs">
            {/* Ward Office Address */}
            <div className="rounded-xl border border-line bg-white p-3">
              <div className="flex items-start gap-2">
                <MapPin size={14} className="text-muted mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-ink">Ward Office</p>
                  <p className="text-muted mt-0.5">{office.address || "Ward Office Central, Kolkata"}</p>
                  <div className="mt-1.5 flex items-center gap-3 text-[11px] text-muted">
                    <span className="flex items-center gap-1">
                      <Clock size={11} /> {office.hours || "08:00 AM – 06:00 PM"}
                    </span>
                    {office.phone && (
                      <span className="font-mono">{office.phone}</span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Sanitation Depot & Fleet Capacity */}
            <div className="rounded-xl border border-line bg-white p-3">
              <div className="flex items-start gap-2">
                <Truck size={14} className="text-accent-deep mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-ink">{depot.name || "Ward Sanitation Yard"}</p>
                  <p className="text-muted text-[11px] mt-0.5">
                    Supervisor: <span className="font-medium text-ink">{depot.supervisor || "Station Officer"}</span>
                  </p>
                  <div className="mt-2 rounded bg-paper p-2 font-mono text-[11px] text-ink border border-line">
                    <span className="font-bold text-accent-deep">Fleet: </span>
                    {depot.fleetCapacity || "10 Battery Tippers, 2 Compactors"}
                  </div>
                </div>
              </div>
            </div>

            {/* Police Liaison */}
            {police.station && (
              <div className="rounded-xl border border-line bg-white p-2.5 flex items-center justify-between text-[11px]">
                <span className="text-muted">Enforcement Police Station:</span>
                <span className="font-medium text-ink">{police.station} ({police.officer})</span>
              </div>
            )}
          </div>
        </div>

        {/* 3. WARD LANDMARKS */}
        {ward.landmarks && ward.landmarks.length > 0 && (
          <div>
            <h4 className="text-[11px] font-bold uppercase tracking-wider text-muted mb-2 flex items-center gap-1.5">
              <Landmark size={13} className="text-accent-deep" />
              Landmarks Within This Ward Boundary
            </h4>

            <div className="flex flex-wrap gap-1.5">
              {ward.landmarks.map((lm) => (
                <button
                  key={lm.id || lm.name}
                  onClick={() => onSelectLandmark(lm)}
                  className="inline-flex items-center gap-1.5 rounded-pill border border-line bg-paper px-2.5 py-1 text-xs text-ink hover:border-accent hover:bg-accent/10 transition-colors"
                >
                  <Landmark size={11} className="text-accent-deep" />
                  <span>{lm.name}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── Footer Controls ── */}
      <div className="border-t border-line bg-paper p-3 flex items-center justify-between gap-2">
        <button
          onClick={() => handleCopy(JSON.stringify(ward, null, 2), "json")}
          className="text-xs text-muted hover:text-ink underline"
        >
          {copied === "json" ? "Copied JSON!" : "Copy Ward Details"}
        </button>

        {isAdmin ? (
          <button
            onClick={() => onEdit(ward)}
            className="rounded-pill bg-ink px-4 py-1.5 text-xs font-semibold text-white hover:bg-surface2 transition-all shadow-xs"
          >
            Edit Ward Authority
          </button>
        ) : (
          <span className="text-[11px] text-muted font-medium">
            Municipal Ward Official Directory
          </span>
        )}
      </div>
    </div>
  );
}
