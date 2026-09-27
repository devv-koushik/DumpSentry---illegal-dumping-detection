import { NavLink } from "react-router-dom";
import {
  LayoutGrid,
  ScanSearch,
  UploadCloud,
  Map as MapIcon,
  Bell,
  BarChart3,
  Settings as SettingsIcon,
  X,
} from "lucide-react";

const ITEMS = [
  { to: "/dashboard", label: "Overview", icon: LayoutGrid, end: true },
  { to: "/dashboard/detections", label: "Detections", icon: ScanSearch },
  { to: "/dashboard/upload", label: "Upload & Analyze", icon: UploadCloud },
  { to: "/dashboard/map", label: "Map", icon: MapIcon },
  { to: "/dashboard/alerts", label: "Alerts", icon: Bell },
  { to: "/dashboard/analytics", label: "Analytics", icon: BarChart3 },
  { to: "/dashboard/settings", label: "Settings", icon: SettingsIcon },
];

export default function Sidebar({ open, onClose }) {
  return (
    <>
      {open && (
        <div className="fixed inset-0 z-40 bg-black/40 lg:hidden" onClick={onClose} aria-hidden="true" />
      )}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-surface text-white transition-transform duration-300 lg:sticky lg:top-0 lg:h-screen lg:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between px-6 py-6">
          <a href="/" className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-accent" />
            <span className="text-sm font-bold tracking-wide">DumpSentry</span>
          </a>
          <button onClick={onClose} className="text-white/60 hover:text-white lg:hidden" aria-label="Close menu">
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 space-y-1 px-3" aria-label="Dashboard">
          {ITEMS.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                  isActive ? "bg-white/10 text-white" : "text-white/60 hover:bg-white/5 hover:text-white"
                }`
              }
            >
              <Icon size={17} />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-white/10 px-6 py-5 text-xs text-white/40">
          AI outputs require human verification before enforcement action.
        </div>
      </aside>
    </>
  );
}
