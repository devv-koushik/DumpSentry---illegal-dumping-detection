import { useState } from "react";
import { Menu, Search, Bell, ChevronDown, ShieldCheck, User } from "lucide-react";
import AdminAuthModal from "./AdminAuthModal";
import { useAuth } from "../context/AuthContext";

export default function Navbar({ onMenuClick }) {
  const [notifOpen, setNotifOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const { isAdmin, user } = useAuth();

  return (
    <header className="sticky top-0 z-30 flex items-center gap-4 border-b border-line bg-paper/90 px-5 py-3.5 backdrop-blur">
      <button onClick={onMenuClick} className="text-ink lg:hidden" aria-label="Open menu">
        <Menu size={22} />
      </button>

      <div className="relative hidden flex-1 max-w-sm sm:block">
        <Search size={15} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
        <input
          type="search"
          placeholder="Search detections, locations…"
          aria-label="Search"
          className="w-full rounded-pill border border-ink/10 bg-white py-2 pl-9 pr-4 text-sm outline-none placeholder:text-muted focus:border-ink/30"
        />
      </div>

      <div className="ml-auto flex items-center gap-4">
        <div className="relative">
          <button
            onClick={() => setNotifOpen((v) => !v)}
            className="relative grid h-9 w-9 place-items-center rounded-full text-ink hover:bg-ink/5"
            aria-label="Notifications"
          >
            <Bell size={18} />
            <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-danger" />
          </button>
          {notifOpen && (
            <div className="absolute right-0 mt-2 w-72 rounded-card border border-ink/10 bg-white p-3 shadow-pop">
              <p className="px-2 py-1 text-xs font-semibold uppercase tracking-wide text-muted">Recent</p>
              {[
                "New suspected dump near Rajarhat flagged 94% confidence",
                "Alert sent to PWD for D-1018",
                "Detection D-1011 marked Suspected Illegal",
              ].map((n, i) => (
                <p key={i} className="rounded-lg px-2 py-2 text-sm text-ink hover:bg-ink/5">
                  {n}
                </p>
              ))}
            </div>
          )}
        </div>

        <button
          onClick={() => setAuthModalOpen(true)}
          className="flex items-center gap-2 rounded-pill border border-ink/10 bg-white py-1.5 pl-1.5 pr-3 text-sm hover:border-ink/30 transition-all cursor-pointer"
          title="Click to manage Admin Authentication"
        >
          <span
            className={`grid h-7 w-7 place-items-center rounded-full text-xs font-semibold text-white ${
              isAdmin ? "bg-accent-deep" : "bg-ink"
            }`}
          >
            {isAdmin ? <ShieldCheck size={14} /> : <User size={14} />}
          </span>
          <span className="hidden font-medium text-ink sm:inline">
            {isAdmin ? (user?.name?.split(" ")[0] || "Admin") : "Sign In"}
          </span>
          <ChevronDown size={14} className="text-muted" />
        </button>
      </div>

      <AdminAuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
      />
    </header>
  );
}
