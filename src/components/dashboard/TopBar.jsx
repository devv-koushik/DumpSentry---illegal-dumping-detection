import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import {
  LayoutDashboard,
  ScanSearch,
  Map,
  Bell,
  BarChart3,
  Upload,
  Radio,
  User,
  Wifi,
  Settings,
} from "lucide-react";

const NAV_ITEMS = [
  { label: "Overview", path: "/dashboard", icon: LayoutDashboard },
  { label: "Detections", path: "/dashboard/detections", icon: ScanSearch },
  { label: "Map", path: "/dashboard/map", icon: Map },
  { label: "Upload", path: "/dashboard/upload", icon: Upload },
  { label: "Alerts", path: "/dashboard/alerts", icon: Bell },
  { label: "Analytics", path: "/dashboard/analytics", icon: BarChart3 },
];

export default function TopBar({ onOpenUpload }) {
  const location = useLocation();
  const [notifCount] = useState(4);

  return (
    <motion.header
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between h-14 px-5 border-b bg-white/85 backdrop-blur-xl border-line font-cmd"
    >
      {/* Left — Brand + Home */}
      <div className="flex items-center gap-4">
        <Link to="/" className="flex items-center gap-2 group" title="Back to Landing Page">
          <span className="h-2.5 w-2.5 rounded-full bg-accent group-hover:scale-125 transition-transform" />
          <span className="text-[12px] font-bold tracking-[0.15em] text-ink uppercase">
            DumpSentry
          </span>
        </Link>
        <span className="hidden text-[9px] tracking-widest text-muted uppercase lg:block">
          Environmental Intelligence Platform
        </span>
      </div>

      {/* Center — Navigation */}
      <nav className="hidden md:flex items-center gap-1 bg-paper2/60 rounded-full px-1.5 py-0.5 border border-line">
        {NAV_ITEMS.map((item) => {
          const isActive =
            item.path === "/dashboard"
              ? location.pathname === "/dashboard"
              : location.pathname.startsWith(item.path);
          const Icon = item.icon;
          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={(e) => {
                if (item.label === "Upload" && onOpenUpload && location.pathname === "/dashboard") {
                  e.preventDefault();
                  onOpenUpload();
                }
              }}
              className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-medium tracking-wide uppercase transition-all duration-300 ${
                isActive
                  ? "text-accent-deep bg-accent/10"
                  : "text-muted hover:text-ink"
              }`}
            >
              <Icon size={12} />
              {item.label}
              {isActive && (
                <motion.span
                  layoutId="topbar-active"
                  className="absolute inset-0 rounded-full border border-accent/30"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.5 }}
                />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Right — Status & Upload CTA */}
      <div className="flex items-center gap-3">
        {/* Upload Drone Capture Button */}
        {onOpenUpload ? (
          <button
            onClick={onOpenUpload}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-accent text-white text-[10px] font-semibold tracking-wide uppercase shadow-sm hover:bg-accent-deep transition-all"
          >
            <Upload size={12} />
            Upload Image
          </button>
        ) : (
          <Link
            to="/dashboard/upload"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-accent text-white text-[10px] font-semibold tracking-wide uppercase shadow-sm hover:bg-accent-deep transition-all"
          >
            <Upload size={12} />
            Upload Image
          </Link>
        )}

        <div className="hidden lg:flex items-center gap-3 ml-1">
          <span className="flex items-center gap-1.5 text-[9px] tracking-wider text-success uppercase">
            <Wifi size={10} className="animate-pulse-slow" />
            AI Online
          </span>
          <span className="w-px h-3 bg-line" />
          <span className="flex items-center gap-1.5 text-[9px] tracking-wider text-muted uppercase">
            <Radio size={10} className="text-accent animate-pulse-slow" />
            Drone Connected
          </span>
        </div>

        <Link to="/dashboard/settings" className="p-1.5 rounded-full hover:bg-paper2 transition-colors">
          <Settings size={14} className="text-muted" />
        </Link>

        <button className="relative p-1.5 rounded-full hover:bg-paper2 transition-colors">
          <Bell size={14} className="text-muted" />
          {notifCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-danger text-[8px] font-bold text-white">
              {notifCount}
            </span>
          )}
        </button>

        <div className="h-7 w-7 rounded-full bg-paper2 border border-line flex items-center justify-center">
          <User size={13} className="text-muted" />
        </div>
      </div>
    </motion.header>
  );
}
