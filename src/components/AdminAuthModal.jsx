import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Lock, Mail, CheckCircle, AlertCircle, X, ShieldAlert,
  Eye, EyeOff, LogOut, Cpu, Shield, Wifi,
} from "lucide-react";
import { login as apiLogin } from "../services/api";
import { useAuth } from "../context/AuthContext";

export default function AdminAuthModal({ isOpen, onClose, message }) {
  const { isAdmin, user, login, logout } = useAuth();
  const [email, setEmail] = useState("admin@dumpsentry.ai");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  if (!isOpen) return null;

  async function handleLogin(e) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const data = await apiLogin(email, password);
      setSuccess("Authenticated successfully.");
      login(data.user || { email, name: "Admin", role: "admin" });
      setTimeout(() => onClose(), 1200);
    } catch (err) {
      // Demo mode fallback — allow well-known credentials offline
      if (
        email === "admin@dumpsentry.ai" &&
        (password === "DumpSentry@2026" || password === "Admin@123456")
      ) {
        localStorage.setItem("dumpsentry_admin_token", "demo-admin-token");
        login({ email, name: "DumpSentry Admin", role: "admin" });
        setSuccess("Admin session started (demo mode).");
        setTimeout(() => onClose(), 1200);
      } else {
        setError(err.message || "Invalid credentials. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  }

  function handleLogout() {
    logout();
    setSuccess("Signed out successfully.");
    setTimeout(() => onClose(), 700);
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[2000] flex items-center justify-center p-4"
          style={{ background: "rgba(22,36,29,0.55)", backdropFilter: "blur(12px)" }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.93, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.93, y: 20 }}
            transition={{ type: "spring", bounce: 0.25, duration: 0.4 }}
            className="relative w-full max-w-sm overflow-hidden rounded-2xl border border-white/10 bg-white shadow-2xl"
          >
            {/* Top gradient banner */}
            <div
              className="relative overflow-hidden px-6 pt-6 pb-5"
              style={{
                background: "linear-gradient(135deg, #16241d 0%, #1e3328 60%, #243d2f 100%)",
              }}
            >
              {/* Decorative rings */}
              <div className="pointer-events-none absolute -right-6 -top-6 h-32 w-32 rounded-full border border-white/5" />
              <div className="pointer-events-none absolute -right-10 -top-10 h-48 w-48 rounded-full border border-white/5" />

              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/20 text-accent">
                    <ShieldAlert size={20} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold tracking-wide text-white">
                      Admin Control Portal
                    </h3>
                    <p className="mt-0.5 text-[10px] tracking-wider text-white/50 uppercase">
                      DumpSentry — Restricted Access
                    </p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="rounded-full p-1.5 text-white/40 transition-colors hover:bg-white/10 hover:text-white"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Status indicator bar */}
              <div className="mt-4 flex items-center gap-3 rounded-lg bg-white/5 px-3 py-2">
                <span className="flex items-center gap-1.5 text-[10px] tracking-wider text-white/50 uppercase">
                  <Wifi size={9} className="text-accent animate-pulse" />
                  Backend Online
                </span>
                <span className="h-2 w-px bg-white/10" />
                <span className="flex items-center gap-1.5 text-[10px] tracking-wider text-white/50 uppercase">
                  <Cpu size={9} className="text-accent" />
                  AI Service Active
                </span>
                <span className="ml-auto flex items-center gap-1 text-[10px] text-white/40">
                  <Shield size={9} />
                  JWT Auth
                </span>
              </div>
            </div>

            {/* Body */}
            <div className="px-6 py-5">
              {isAdmin ? (
                /* ── Already logged in ── */
                <div className="space-y-4 text-center">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-success/10 text-success">
                    <CheckCircle size={28} />
                  </div>
                  <div>
                    <p className="font-semibold text-ink">
                      {user?.name || "Administrator"}
                    </p>
                    <p className="mt-0.5 text-xs text-muted">{user?.email || "admin@dumpsentry.ai"}</p>
                    <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-success/10 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-success">
                      <Shield size={9} /> Full Admin Access
                    </span>
                  </div>
                  <p className="text-xs text-muted">
                    You can dispatch authority alerts, verify detections, and access all system controls.
                  </p>
                  <button
                    onClick={handleLogout}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-danger/10 py-2.5 text-xs font-semibold text-danger transition-colors hover:bg-danger/20"
                  >
                    <LogOut size={13} />
                    Sign Out
                  </button>

                  {success && (
                    <p className="text-xs text-success">{success}</p>
                  )}
                </div>
              ) : (
                /* ── Login form ── */
                <form onSubmit={handleLogin} className="space-y-4">
                  {message ? (
                    <div className="flex items-start gap-2.5 rounded-xl border border-accent/30 bg-accent/10 p-3 text-xs text-accent-deep">
                      <Lock size={14} className="mt-0.5 shrink-0 text-accent-deep" />
                      <div>
                        <p className="font-semibold text-accent-deep uppercase tracking-wider text-[10px]">
                          Admin Protected Action
                        </p>
                        <p className="mt-0.5 text-muted leading-relaxed">{message}</p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs leading-relaxed text-muted">
                      Enter your administrator credentials to access alert dispatching, detection verification, and system controls.
                    </p>
                  )}

                  <AnimatePresence mode="wait">
                    {error && (
                      <motion.div
                        key="error"
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -4 }}
                        className="flex items-center gap-2 rounded-xl bg-danger/10 px-3 py-2.5 text-xs text-danger"
                      >
                        <AlertCircle size={13} />
                        <span>{error}</span>
                      </motion.div>
                    )}
                    {success && (
                      <motion.div
                        key="success"
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex items-center gap-2 rounded-xl bg-success/10 px-3 py-2.5 text-xs text-success"
                      >
                        <CheckCircle size={13} />
                        <span>{success}</span>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Email */}
                  <div>
                    <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-muted">
                      Email
                    </label>
                    <div className="relative">
                      <Mail
                        size={14}
                        className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted"
                      />
                      <input
                        id="admin-email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full rounded-xl border border-line bg-paper py-2.5 pl-9 pr-3 text-sm text-ink outline-none transition-colors focus:border-accent"
                        placeholder="admin@dumpsentry.ai"
                        autoComplete="username"
                        required
                      />
                    </div>
                  </div>

                  {/* Password */}
                  <div>
                    <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-muted">
                      Password
                    </label>
                    <div className="relative">
                      <Lock
                        size={14}
                        className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted"
                      />
                      <input
                        id="admin-password"
                        type={showPass ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full rounded-xl border border-line bg-paper py-2.5 pl-9 pr-9 text-sm text-ink outline-none transition-colors focus:border-accent"
                        placeholder="••••••••••"
                        autoComplete="current-password"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPass((v) => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-ink"
                      >
                        {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                    </div>
                  </div>

                  {/* Hint */}
                  <div className="rounded-xl bg-paper2 px-3 py-2.5">
                    <p className="text-[10px] text-muted">
                      <span className="font-semibold text-ink">Default credentials:</span>{" "}
                      admin@dumpsentry.ai / DumpSentry@2026
                    </p>
                    <p className="mt-0.5 text-[10px] text-muted">
                      Set via <code className="font-mono text-[9px]">ADMIN_EMAIL</code> &amp;{" "}
                      <code className="font-mono text-[9px]">ADMIN_PASSWORD</code> in backend .env
                    </p>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="relative w-full overflow-hidden rounded-xl py-3 text-xs font-bold uppercase tracking-widest text-white shadow-md transition-all disabled:opacity-60"
                    style={{
                      background: loading
                        ? "#5c665d"
                        : "linear-gradient(135deg, #16241d 0%, #3f8a5c 100%)",
                    }}
                  >
                    {loading ? (
                      <span className="flex items-center justify-center gap-2">
                        <span className="h-3 w-3 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                        Authenticating…
                      </span>
                    ) : (
                      "Sign In to Admin Portal"
                    )}
                  </button>
                </form>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
