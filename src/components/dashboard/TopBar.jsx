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
  Settings,
  ShieldCheck,
  AlertTriangle,
  ClipboardList,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import ReportProblemModal from "../ReportProblemModal";

const ALL_NAV_ITEMS = [
  { label: "Overview", path: "/dashboard", icon: LayoutDashboard },
  { label: "Detections", path: "/dashboard/detections", icon: ScanSearch },
  { label: "Map", path: "/dashboard/map", icon: Map },
  { label: "Upload", path: "/dashboard/upload", icon: Upload, adminOnly: true },
  { label: "Alerts", path: "/dashboard/alerts", icon: Bell },
  { label: "Citizen Reports", path: "/dashboard/reports", icon: ClipboardList, adminOnly: true },
  { label: "Analytics", path: "/dashboard/analytics", icon: BarChart3 },
];

export default function TopBar({ onOpenUpload }) {
  const location = useLocation();
  const [notifCount] = useState(4);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const { isAdmin, user, openLoginModal } = useAuth();

  const navItems = ALL_NAV_ITEMS.filter((item) => !item.adminOnly || isAdmin);

  return (
    <>
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
          {navItems.map((item) => {
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

        {/* Right — Public Report Problem & Admin Tools */}
        <div className="flex items-center gap-2.5">
          {/* Public Citizen Report Button — Only visible to Public Visitors */}
          {!isAdmin && (
            <button
              onClick={() => setIsReportOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-accent/10 border border-accent/30 text-accent-deep text-[10px] font-semibold tracking-wide uppercase shadow-sm hover:bg-accent hover:text-white transition-all"
              title="Report an illegal dumping problem"
            >
              <AlertTriangle size={12} className="text-accent" />
              Report Problem
            </button>
          )}


          <div className="hidden lg:flex items-center gap-3 ml-1">
            <span className="flex items-center gap-1.5 text-[9px] tracking-wider text-muted uppercase">
              <Radio size={10} className="text-accent animate-pulse-slow" />
              Drone Connected
            </span>
          </div>

          {/* Admin Settings link — Visible only to Admin */}
          {isAdmin && (
            <Link
              to="/dashboard/settings"
              className="p-1.5 rounded-full hover:bg-paper2 transition-colors"
              title="System Settings"
            >
              <Settings size={14} className="text-muted" />
            </Link>
          )}

          <button className="relative p-1.5 rounded-full hover:bg-paper2 transition-colors">
            <Bell size={14} className="text-muted" />
            {notifCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-danger text-[8px] font-bold text-white">
                {notifCount}
              </span>
            )}
          </button>

          {/* Admin avatar / login button */}
          <button
            onClick={() => openLoginModal()}
            title={isAdmin ? `Signed in as ${user?.name || "Admin"}` : "Sign in as Admin"}
            className={`flex items-center gap-1.5 rounded-full border px-2 py-1 text-[10px] font-semibold transition-all ${
              isAdmin
                ? "border-accent/30 bg-accent/10 text-accent-deep hover:bg-accent/20"
                : "border-line bg-white text-muted hover:text-ink hover:border-ink/20"
            }`}
          >
            {isAdmin ? (
              <ShieldCheck size={12} className="text-accent-deep" />
            ) : (
              <User size={12} />
            )}
            <span className="hidden lg:inline">
              {isAdmin ? (user?.name?.split(" ")[0] || "Admin") : "Sign In"}
            </span>
          </button>
        </div>
      </motion.header>

      {/* Citizen Report Problem Modal */}
      <ReportProblemModal
        isOpen={isReportOpen}
        onClose={() => setIsReportOpen(false)}
      />
    </>
  );
}
