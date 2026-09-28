import { useState } from "react";
import { Link } from "react-router-dom";
import { Menu, X, ArrowRight } from "lucide-react";
import { useLenis } from "../context/LenisContext";

const LINKS = [
  { href: "#how-it-works", label: "How It Works" },
  { href: "#detection", label: "AI Detection" },
  { href: "#authority", label: "Authority Routing" },
  { href: "#stats", label: "Impact" },
];

export default function LandingNav() {
  const [open, setOpen] = useState(false);
  const lenisContext = useLenis();

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

        <Link to="/dashboard" className="btn-primary ml-auto hidden !py-2 text-xs md:ml-0 md:inline-flex">
          Open Dashboard <ArrowRight size={14} />
        </Link>

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
            <Link to="/dashboard" className="btn-primary mt-2 justify-center">
              Open Dashboard <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}

