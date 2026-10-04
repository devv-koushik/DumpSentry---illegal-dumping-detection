import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ShieldAlert,
  Lock,
  ArrowRight,
  Eye,
  Upload,
  Cpu,
  CheckCircle2,
  Bell,
  Settings,
  Shield,
  Layers,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

/**
 * AdminGuard component
 * Protects pages and full sections that require Admin privileges.
 * Public users can freely view public sections (Landing, Dashboard, Map, History, Details, Analytics).
 * Admin-only actions and management screens display this locked gate with direct sign-in.
 */
export default function AdminGuard({
  children,
  action = "manage this feature",
  title = "Administrator Access Required",
  description,
}) {
  const { isAdmin, openLoginModal } = useAuth();

  if (isAdmin) {
    return <>{children}</>;
  }

  const defaultDescription =
    description ||
    `Public users can explore detection maps, incident feeds, and environmental analytics. Only authorized administrators can ${action}.`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="mx-auto my-8 max-w-3xl overflow-hidden rounded-2xl border border-line bg-white shadow-pop font-cmd"
    >
      {/* Top Banner Header */}
      <div
        className="relative overflow-hidden px-8 py-8"
        style={{
          background: "linear-gradient(135deg, #10201A 0%, #1e3328 60%, #243d2f 100%)",
        }}
      >
        <div className="pointer-events-none absolute -right-10 -top-10 h-48 w-48 rounded-full border border-white/5" />
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-accent/20 border border-accent/40 text-accent">
            <Lock size={24} />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-accent/20 px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-accent">
                Protected Admin Area
              </span>
              <span className="text-[10px] text-white/40 uppercase tracking-widest font-mono">
                DumpSentry RBAC
              </span>
            </div>
            <h2 className="mt-2 text-xl font-bold tracking-tight text-white">
              {title}
            </h2>
            <p className="mt-1 text-xs leading-relaxed text-white/70 max-w-xl">
              {defaultDescription}
            </p>
          </div>
        </div>
      </div>

      {/* Permissions Breakdown Matrix */}
      <div className="grid border-b border-line bg-paper/50 sm:grid-cols-2">
        {/* Public Permissions */}
        <div className="p-6 border-b sm:border-b-0 sm:border-r border-line">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted mb-3">
            <Eye size={13} className="text-accent" />
            <span>Public Access (Unrestricted)</span>
          </div>
          <ul className="space-y-2 text-xs text-muted">
            <li className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-success" />
              <span>Landing page & overview</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-success" />
              <span>Real-time detection map & telemetry</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-success" />
              <span>Detection history & timeline archives</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-success" />
              <span>Public incident detail view & GPS data</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-success" />
              <span>Macro environmental analytics & charts</span>
            </li>
          </ul>
        </div>

        {/* Protected Admin Permissions */}
        <div className="p-6 bg-accent/[0.03]">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-accent-deep mb-3">
            <ShieldAlert size={13} className="text-accent-deep" />
            <span>Administrator Privileges Only</span>
          </div>
          <ul className="space-y-2 text-xs text-ink/80">
            <li className="flex items-center gap-2">
              <Upload size={12} className="text-accent-deep" />
              <span>Manual drone image upload & pipeline execution</span>
            </li>
            <li className="flex items-center gap-2">
              <Cpu size={12} className="text-accent-deep" />
              <span>Run YOLOv11 aerial vision analysis</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 size={12} className="text-accent-deep" />
              <span>Verify / reject suspected dumping detections</span>
            </li>
            <li className="flex items-center gap-2">
              <Layers size={12} className="text-accent-deep" />
              <span>Change incident lifecycle & resolution status</span>
            </li>
            <li className="flex items-center gap-2">
              <Bell size={12} className="text-accent-deep" />
              <span>Dispatch authority alerts & notifications</span>
            </li>
            <li className="flex items-center gap-2">
              <Settings size={12} className="text-accent-deep" />
              <span>Manage municipal authorities & geospatial rules</span>
            </li>
          </ul>
        </div>
      </div>

      {/* Footer CTA */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-6 bg-white">
        <p className="text-xs text-muted">
          Need administrative access? Log in with your authorized admin account.
        </p>
        <div className="flex items-center gap-3">
          <Link
            to="/dashboard"
            className="rounded-xl border border-line px-4 py-2 text-xs font-medium text-muted hover:bg-paper hover:text-ink transition-colors"
          >
            Public Dashboard
          </Link>
          <button
            onClick={() => openLoginModal(`Sign in as Admin to ${action}.`)}
            className="flex items-center gap-2 rounded-xl bg-accent px-5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-accent-deep transition-all"
          >
            <Shield size={14} />
            <span>Sign In as Admin</span>
            <ArrowRight size={13} />
          </button>
        </div>
      </div>
    </motion.div>
  );
}
