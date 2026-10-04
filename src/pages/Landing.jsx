import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  Satellite,
  ScanSearch,
  Layers,
  Send,
  MapPin,
  ShieldAlert,
  Building2,
  School,
  GraduationCap,
  Route,
  Landmark,
  Globe,
  Mail,
  MessageCircle,
  AlertTriangle,
} from "lucide-react";
import LandingNav from "../components/LandingNav";
import ReportProblemModal from "../components/ReportProblemModal";
import { useLenis } from "../context/LenisContext";
import { useAuth } from "../context/AuthContext";
import { useState, useEffect } from "react";
import { fetchOverviewStats } from "../services/api";

const DEFAULT_STATS = {
  total: 0,
  suspectedIllegal: 0,
  pendingReview: 0,
  resolved: 0,
};

const fadeUp = {
  hidden: { opacity: 0, y: 18 },
  show: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, delay: i * 0.08, ease: [0.16, 1, 0.3, 1] },
  }),
};

const STEPS = [
  { n: "01", title: "Capture", desc: "Drone imagery captures suspected dumping sites.", icon: Satellite },
  { n: "02", title: "Detect", desc: "Computer vision identifies garbage and dumping areas.", icon: ScanSearch },
  { n: "03", title: "Classify", desc: "AI analyzes waste type and surrounding context.", icon: Layers },
  { n: "04", title: "Report", desc: "The system routes the incident to the relevant authority.", icon: Send },
];

const AUTHORITY_ROWS = [
  { icon: Building2, context: "Hospital", authority: "Hospital Superintendent" },
  { icon: School, context: "School", authority: "School Administration" },
  { icon: GraduationCap, context: "College", authority: "College Administration" },
  { icon: Route, context: "Roadside", authority: "PWD / Municipal Authority" },
  { icon: Landmark, context: "Public Area", authority: "Civic Authority" },
];

export default function Landing() {
  const lenisContext = useLenis();
  const { isAdmin } = useAuth();
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [stats, setStats] = useState(DEFAULT_STATS);

  useEffect(() => {
    fetchOverviewStats()
      .then((data) => {
        if (data && typeof data === "object") {
          setStats({
            total: data.total ?? data.totalDetections ?? DEFAULT_STATS.total,
            suspectedIllegal: data.suspectedIllegal ?? DEFAULT_STATS.suspectedIllegal,
            pendingReview: data.pendingReview ?? DEFAULT_STATS.pendingReview,
            resolved: data.resolved ?? DEFAULT_STATS.resolved,
          });
        }
      })
      .catch(() => {
        // Fallback to default stats if API is unavailable
      });
  }, []);

  const handleScrollTo = (e, href) => {
    e.preventDefault();
    const targetEl = document.querySelector(href);
    if (lenisContext?.scrollTo) {
      lenisContext.scrollTo(href, { offset: -70, duration: 1.4 });
    } else if (targetEl) {
      targetEl.scrollIntoView({ behavior: "smooth" });
    }

    if (targetEl) {
      targetEl.classList.remove("section-highlight");
      void targetEl.offsetWidth;
      targetEl.classList.add("section-highlight");
      setTimeout(() => {
        targetEl.classList.remove("section-highlight");
      }, 1500);
    }
  };

  return (
    <div id="top" className="bg-paper text-ink">
      <LandingNav />

      {/* HERO */}
      <section className="relative grid min-h-[86vh] grid-cols-1 items-center gap-10 overflow-hidden px-5 py-16 md:grid-cols-[1.05fr,0.95fr] md:px-8 lg:py-0">
        <div className="relative z-10">
          <motion.p variants={fadeUp} initial="hidden" animate="show" className="eyebrow mb-5">
            AI + Drone Surveillance
          </motion.p>
          <motion.h1
            variants={fadeUp}
            initial="hidden"
            animate="show"
            custom={1}
            className="text-4xl font-semibold leading-[1.08] tracking-tight sm:text-5xl lg:text-6xl"
          >
            Spotting Illegal{" "}
            <span className="relative inline-block overflow-hidden rounded-2xl bg-[url('/dumpinf_landing.webp')] bg-cover bg-center px-3.5 py-1 text-white shadow-md border border-white/20 align-middle">
              <span className="absolute inset-0 bg-black/40 backdrop-blur-[0.5px]" />
              <span className="relative z-10">Dumping,</span>
            </span>
            <br />
            Alerting The Right Hands
          </motion.h1>
          <motion.p
            variants={fadeUp}
            initial="hidden"
            animate="show"
            custom={2}
            className="mt-6 max-w-lg text-base leading-relaxed text-muted"
          >
            Drones patrol hospitals, schools and roadsides. Our vision model reads
            every frame, flags suspected illegal dumping, and routes the incident to
            the authority responsible — long before a resident has to file a complaint.
          </motion.p>

          <motion.div variants={fadeUp} initial="hidden" animate="show" custom={3} className="mt-9 flex flex-wrap items-center gap-4">
            <Link to="/dashboard" className="btn-accent">
              Open Dashboard <ArrowRight size={16} />
            </Link>
            {!isAdmin && (
              <button
                onClick={() => setIsReportOpen(true)}
                className="flex items-center gap-2 rounded-xl border border-accent/40 bg-accent/10 px-5 py-3 text-sm font-semibold text-accent-deep hover:bg-accent hover:text-white transition-all shadow-sm"
              >
                <AlertTriangle size={16} />
                Report a Problem
              </button>
            )}
            <a href="#how-it-works" onClick={(e) => handleScrollTo(e, "#how-it-works")} className="btn-outline">
              How it works
            </a>
          </motion.div>

          <motion.dl
            variants={fadeUp}
            initial="hidden"
            animate="show"
            custom={4}
            className="mt-12 flex flex-wrap gap-x-10 gap-y-4 border-t border-line pt-6"
          >
            <div>
              <dt className="font-mono text-2xl font-semibold">{stats.total}+</dt>
              <dd className="text-xs text-muted">Dumps detected</dd>
            </div>
            <div>
              <dt className="font-mono text-2xl font-semibold">40</dt>
              <dd className="text-xs text-muted">Zones monitored</dd>
            </div>
            <div>
              <dt className="font-mono text-2xl font-semibold">6 min</dt>
              <dd className="text-xs text-muted">Avg. alert time</dd>
            </div>
          </motion.dl>
        </div>

        <motion.div
          initial={{ opacity: 0, x: 26 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
          className="relative isolate h-[420px] overflow-hidden rounded-card bg-surface md:h-[560px]"
        >
          {/* Base image from public folder */}
          <img
            src="/dumpinf_landing.webp"
            alt="Drone Surveillance Illegal Dumping Detection"
            className="absolute inset-0 h-full w-full object-cover object-center"
          />
          {/* Subtle dark overlay for contrast */}
          <div className="absolute inset-0 bg-surface/40 backdrop-blur-[0.5px]" />

          <div
            className="absolute inset-0 opacity-40"
            style={{
              backgroundImage:
                "linear-gradient(rgba(255,255,255,.06) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.06) 1px, transparent 1px)",
              backgroundSize: "34px 34px",
              maskImage: "radial-gradient(ellipse at 45% 40%, #000 0%, transparent 78%)",
              WebkitMaskImage: "radial-gradient(ellipse at 45% 40%, #000 0%, transparent 78%)",
            }}
          />
          <div
            className="absolute inset-0 animate-[spin_8s_linear_infinite]"
            style={{ background: "conic-gradient(from 0deg at 44% 40%, rgba(226,163,59,.42), transparent 32%)" }}
          />
          <div className="absolute left-[40%] top-[36%] h-9 w-9 -translate-x-1/2 -translate-y-1/2 text-white">
            <svg viewBox="0 0 48 48" fill="none" className="h-full w-full">
              <circle cx="24" cy="24" r="4.5" fill="currentColor" />
              <path d="M24 19v-6M24 29v6M19 24h-6M29 24h6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              <circle cx="10" cy="10" r="5" stroke="currentColor" strokeWidth="2" />
              <circle cx="38" cy="10" r="5" stroke="currentColor" strokeWidth="2" />
              <circle cx="10" cy="38" r="5" stroke="currentColor" strokeWidth="2" />
              <circle cx="38" cy="38" r="5" stroke="currentColor" strokeWidth="2" />
            </svg>
          </div>

          <div className="absolute left-[36%] top-[26%]">
            <span className="absolute -left-2 -top-2 h-4 w-4 rounded-full border-[3px] border-accent" />
            <span className="absolute left-8 top-6 whitespace-nowrap rounded-pill bg-white px-3.5 py-1.5 text-xs font-medium text-ink shadow-pop">
              Waste detected <b className="font-mono text-accent-deep">94%</b>
            </span>
          </div>
          <div className="absolute left-[58%] top-[62%]">
            <span className="absolute -left-2 -top-2 h-4 w-4 rounded-full border-[3px] border-white" />
            <span className="absolute left-8 top-1 whitespace-nowrap rounded-pill bg-white px-3.5 py-1.5 text-xs font-medium text-ink shadow-pop">
              PWD notified <span className="text-muted">2 min ago</span>
            </span>
          </div>

          <div className="absolute bottom-0 right-0 flex items-center gap-5 rounded-tl-[32px] rounded-br-card bg-white px-6 py-4">
            <a href="#" aria-label="Website" className="text-ink hover:opacity-60"><Globe size={17} /></a>
            <a href="#" aria-label="Chat" className="text-ink hover:opacity-60"><MessageCircle size={17} /></a>
            <a href="mailto:alerts@dumpsentry.ai" aria-label="Email" className="text-ink hover:opacity-60"><Mail size={17} /></a>
          </div>
        </motion.div>
      </section>

      {/* PROBLEM */}
      <section className="section border-t border-line">
        <div className="container-x grid gap-10 md:grid-cols-2 md:items-center">
          <motion.div variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true }}>
            <p className="eyebrow mb-4">The Problem</p>
            <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              Illegal dumping goes unnoticed until it becomes a crisis
            </h2>
          </motion.div>
          <motion.p
            variants={fadeUp}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            custom={1}
            className="text-base leading-relaxed text-muted"
          >
            Waste piles up along roadsides, near water bodies, and behind institutions
            long before a civic authority ever hears about it. Manual inspection is
            slow, complaint-driven, and misses sites that no one walks past. By the
            time it's reported, it's already a health hazard — for a hospital, a
            school, or an entire neighborhood.
          </motion.p>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how-it-works" className="section border-t border-line bg-white">
        <div className="container-x">
          <motion.div variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true }} className="mb-14 max-w-xl">
            <p className="eyebrow mb-4">How It Works</p>
            <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">From flight path to filed report, automatically</h2>
          </motion.div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((s, i) => (
              <motion.div
                key={s.n}
                variants={fadeUp}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true }}
                custom={i}
                className="card relative p-6"
              >
                <span className="font-mono text-xs text-muted">{s.n}</span>
                <div className="mt-4 grid h-11 w-11 place-items-center rounded-full bg-ink/5 text-ink">
                  <s.icon size={19} />
                </div>
                <h3 className="mt-5 font-semibold text-ink">{s.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{s.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* AI DETECTION PREVIEW */}
      <section id="detection" className="section border-t border-line">
        <div className="container-x grid gap-12 md:grid-cols-2 md:items-center">
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            className="relative overflow-hidden rounded-card border border-ink/10"
          >
            <img src="https://picsum.photos/seed/detection-preview/900/620" alt="Drone capture with AI detection overlay" className="h-full w-full object-cover" />
            <div className="pointer-events-none absolute left-[18%] top-[28%] h-24 w-32 rounded-md border-2 border-accent">
              <span className="absolute -top-7 left-0 rounded-pill bg-surface px-2.5 py-1 text-[11px] font-medium text-white">
                Mixed Waste · 94%
              </span>
            </div>
            <div className="pointer-events-none absolute bottom-[16%] right-[20%] h-16 w-24 rounded-md border-2 border-accent/70">
              <span className="absolute -top-7 left-0 rounded-pill bg-surface px-2.5 py-1 text-[11px] font-medium text-white">
                Plastic · 81%
              </span>
            </div>
          </motion.div>

          <motion.div variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true }} custom={1}>
            <p className="eyebrow mb-4">AI Detection</p>
            <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              Computer vision reads every frame the drone sends back
            </h2>
            <p className="mt-5 max-w-md text-base leading-relaxed text-muted">
              Each capture is scored for waste presence, classified by material, and
              matched against its surrounding context. An image alone is never treated
              as proof — every result is labelled{" "}
              <span className="font-medium text-ink">Suspected Illegal Dumping</span> and
              routed for <span className="font-medium text-ink">human verification</span>{" "}
              before any enforcement step.
            </p>
            <ul className="mt-6 space-y-3 text-sm text-ink">
              {["Waste type classification", "Confidence scoring per detection", "Nearby-context recognition", "Human-in-the-loop review"].map((f) => (
                <li key={f} className="flex items-center gap-2.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-accent" /> {f}
                </li>
              ))}
            </ul>
          </motion.div>
        </div>
      </section>

      {/* AUTHORITY ROUTING */}
      <section id="authority" className="section border-t border-line bg-white">
        <div className="container-x">
          <motion.div variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true }} className="mb-12 max-w-xl">
            <p className="eyebrow mb-4">Authority Routing</p>
            <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">The right office, every time — not a generic inbox</h2>
            <p className="mt-4 text-base leading-relaxed text-muted">
              Context detection decides who gets notified, so a dump behind a hospital
              never waits in the same queue as one beside a highway.
            </p>
          </motion.div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {AUTHORITY_ROWS.map((r, i) => (
              <motion.div
                key={r.context}
                variants={fadeUp}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true }}
                custom={i}
                className="card flex flex-col gap-4 p-5"
              >
                <div className="grid h-10 w-10 place-items-center rounded-full bg-ink/5 text-ink">
                  <r.icon size={18} />
                </div>
                <div>
                  <p className="text-xs text-muted">{r.context}</p>
                  <p className="mt-1 text-sm font-medium text-ink">{r.authority}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* STATISTICS */}
      <section id="stats" className="section border-t border-line bg-surface text-white">
        <div className="container-x">
          <motion.p variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true }} className="eyebrow mb-4 !text-accent">
            Platform Impact
          </motion.p>
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { label: "Total Detections", value: stats.total, icon: ScanSearch },
              { label: "Suspected Illegal", value: stats.suspectedIllegal, icon: ShieldAlert },
              { label: "Pending Review", value: stats.pendingReview, icon: Layers },
              { label: "Resolved", value: stats.resolved, icon: MapPin },
            ].map((s, i) => (
              <motion.div key={s.label} variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true }} custom={i}>
                <s.icon size={20} className="text-accent" />
                <p className="mt-4 font-mono text-4xl font-semibold">{s.value}</p>
                <p className="mt-1 text-sm text-white/60">{s.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="section border-t border-line">
        <div className="container-x flex flex-col items-start gap-6 rounded-card bg-ink/[.03] p-10 md:flex-row md:items-center md:justify-between md:p-14">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">See a live detection walkthrough</h2>
            <p className="mt-2 max-w-md text-sm text-muted">
              Explore the dashboard with sample drone captures, AI scoring, and the
              authority-routing workflow — no setup required.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3 flex-shrink-0">
            {!isAdmin && (
              <button
                onClick={() => setIsReportOpen(true)}
                className="flex items-center gap-1.5 rounded-xl border border-accent/40 bg-accent/10 px-5 py-3 text-sm font-semibold text-accent-deep hover:bg-accent hover:text-white transition-all shadow-sm"
              >
                <AlertTriangle size={15} />
                Report a Problem
              </button>
            )}
            <Link to="/dashboard" className="btn-accent">
              Open Dashboard <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-line bg-white">
        <div className="container-x flex flex-col gap-8 py-12 md:flex-row md:items-start md:justify-between">
          <div>
            <a href="#top" onClick={(e) => handleScrollTo(e, "#top")} className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-accent" />
              <span className="text-sm font-bold uppercase tracking-wide">DumpSentry</span>
            </a>
            <p className="mt-3 max-w-xs text-sm text-muted">
              AI-assisted drone monitoring for illegal dumping. Every detection is
              reviewed by a human before it becomes an enforcement action.
            </p>
          </div>
          <div className="flex gap-16">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted">Product</p>
              <div className="mt-3 flex flex-col gap-2 text-sm">
                <a href="#how-it-works" onClick={(e) => handleScrollTo(e, "#how-it-works")} className="text-ink/75 hover:text-ink">How it works</a>
                <a href="#detection" onClick={(e) => handleScrollTo(e, "#detection")} className="text-ink/75 hover:text-ink">AI detection</a>
                <Link to="/dashboard" className="text-ink/75 hover:text-ink">Dashboard</Link>
                {!isAdmin && (
                  <button onClick={() => setIsReportOpen(true)} className="text-left text-ink/75 hover:text-ink">
                    Report a Problem
                  </button>
                )}
              </div>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted">Connect</p>
              <div className="mt-3 flex gap-4">
                <a href="#" aria-label="Website" className="text-ink/70 hover:text-ink"><Globe size={17} /></a>
                <a href="#" aria-label="Chat" className="text-ink/70 hover:text-ink"><MessageCircle size={17} /></a>
                <a href="mailto:alerts@dumpsentry.ai" aria-label="Email" className="text-ink/70 hover:text-ink"><Mail size={17} /></a>
              </div>
            </div>
          </div>
        </div>
        <div className="border-t border-line py-5 text-center text-xs text-muted">
          © {new Date().getFullYear()} DumpSentry. Aerial AI & Geospatial Authority Routing Platform.
        </div>
      </footer>

      {/* Public Citizen Report Modal */}
      <ReportProblemModal
        isOpen={isReportOpen}
        onClose={() => setIsReportOpen(false)}
      />
    </div>
  );
}
