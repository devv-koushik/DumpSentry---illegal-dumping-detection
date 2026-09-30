import { useState } from "react";
import { Link } from "react-router-dom";
import { Menu, X, ArrowRight, AlertTriangle } from "lucide-react";
import { useLenis } from "../context/LenisContext";
import { useAuth } from "../context/AuthContext";
import ReportProblemModal from "./ReportProblemModal";

const LINKS = [
  { href: "#how-it-works", label: "How It Works" },
  { href: "#detection", label: "AI Detection" },
  { href: "#authority", label: "Authority Routing" },
  { href: "#stats", label: "Impact" },
];

export default function LandingNav() {
  const [open, setOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const lenisContext = useLenis();
  const { isAdmin } = useAuth();

  const handleNavClick = (e, href) => {
    e.preventDefault();
    setOpen(false);

    const targetEl = document.querySelector(href);
    if (lenisContext?.scrollTo) {
      lenisContext.scrollTo(href, { offset: -70, duration: 1.4 });
    } else if (targetEl) {
      targetEl.scrollIntoView({ behavior: "smooth" });
    }

    if (targetEl) {
      targetEl.classList.remove("section-highlight");
      // Trigger reflow to restart CSS animation
      void targetEl.offsetWidth;
      targetEl.classList.add("section-highlight");
      setTimeout(() => {
        targetEl.classList.remove("section-highlight");
      }, 1500);
    }
  };

  return (
    <header className="sticky top-0 z-50 border-b border-line/70 bg-paper/85 backdrop-blur">
      <div className="container-x flex h-16 items-center gap-8">
        <a href="#top" onClick={(e) => handleNavClick(e, "#top")} className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-accent" />
          <span className="text-sm font-bold uppercase tracking-wide text-ink">DumpSentry</span>
        </a>

        <nav className="ml-auto hidden items-center gap-8 md:flex" aria-label="Primary">
          {LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              onClick={(e) => handleNavClick(e, l.href)}
              className="group relative text-sm font-medium text-ink/75 transition-colors hover:text-ink"
            >
              {l.label}
              <span className="absolute -bottom-1 left-0 h-0.5 w-0 bg-accent transition-all duration-300 group-hover:w-full" />
            </a>
          ))}
        </nav>

        <div className="ml-auto hidden items-center gap-3 md:flex">
          {!isAdmin && (
            <button
              onClick={() => setReportOpen(true)}
              className="flex items-center gap-1.5 rounded-full border border-accent/40 bg-accent/10 px-3.5 py-1.5 text-xs font-semibold text-accent-deep hover:bg-accent hover:text-white transition-all uppercase tracking-wider"
            >
              Report Problem
            </button>
          )}
          <Link to="/dashboard" className="btn-primary !py-2 text-xs">
            Open Dashboard <ArrowRight size={14} />
          </Link>
        </div>

        <button className="ml-auto text-ink md:hidden" onClick={() => setOpen((v) => !v)} aria-label="Menu">
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {open && (
        <div className="border-t border-line/70 bg-paper px-5 py-4 md:hidden">
          <div className="flex flex-col gap-1">
            {LINKS.map((l) => (
              <a
                key={l.href}
                href={l.href}
                onClick={(e) => handleNavClick(e, l.href)}
                className="rounded-lg px-2 py-2.5 text-sm font-medium text-ink hover:bg-ink/5"
              >
                {l.label}
              </a>
            ))}
            {!isAdmin && (
              <button
                onClick={() => {
                  setOpen(false);
                  setReportOpen(true);
                }}
                className="flex items-center justify-center gap-1.5 rounded-lg border border-accent/40 bg-accent/10 px-3 py-2.5 text-xs font-semibold text-accent-deep hover:bg-accent hover:text-white transition-all uppercase tracking-wider mt-1"
              >
                <AlertTriangle size={14} /> Report Problem
              </button>
            )}
            <Link to="/dashboard" className="btn-primary mt-2 justify-center">
              Open Dashboard <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      )}

      <ReportProblemModal
        isOpen={reportOpen}
        onClose={() => setReportOpen(false)}
      />
    </header>
  );
}

