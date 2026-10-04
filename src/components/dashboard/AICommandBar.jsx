import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Send, Terminal, Loader2 } from "lucide-react";
import { askDumpSentryAI, QUICK_CHIPS } from "../../services/commandAI";

export default function AICommandBar() {
  const [query, setQuery] = useState("");
  const [response, setResponse] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showResponse, setShowResponse] = useState(false);
  const inputRef = useRef(null);

  const handleSubmit = async (q) => {
    const text = q || query;
    if (!text.trim()) return;

    setLoading(true);
    setShowResponse(true);
    try {
      const res = await askDumpSentryAI(text);
      setResponse(res);
    } catch {
      setResponse({ text: "Unable to process query. Please try again.", highlights: [] });
    } finally {
      setLoading(false);
      setQuery("");
    }
  };

  const handleChip = (chip) => {
    setQuery(chip);
    handleSubmit(chip);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.6 }}
      className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30 w-[min(92vw,560px)] font-cmd"
    >
      {/* AI Response */}
      <AnimatePresence>
        {showResponse && response && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.97 }}
            transition={{ duration: 0.3 }}
            className="mb-2 px-4 py-3 rounded-xl bg-white/95 backdrop-blur-xl border border-line shadow-pop"
          >
            <div className="flex items-center gap-1.5 mb-2">
              <Terminal size={10} className="text-accent" />
              <span className="text-[9px] font-semibold tracking-widest text-accent-deep uppercase">
                DumpSentry Commands
              </span>
              <button
                onClick={() => setShowResponse(false)}
                className="ml-auto text-[9px] text-muted hover:text-ink transition-colors"
              >
                Dismiss
              </button>
            </div>
            {loading ? (
              <div className="flex items-center gap-2 py-2">
                <Loader2 size={12} className="text-accent animate-spin" />
                <span className="text-[11px] text-muted">Analyzing surveillance data...</span>
              </div>
            ) : (
              <p
                className="text-[11px] leading-relaxed text-ink/80"
                dangerouslySetInnerHTML={{
                  __html: response.text
                    .replace(/\*\*(.*?)\*\*/g, '<strong class="text-accent-deep font-semibold">$1</strong>'),
                }}
              />
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Quick Chips */}
      <div className="flex items-center gap-1.5 mb-2 px-1 overflow-x-auto hide-scrollbar">
        {QUICK_CHIPS.map((chip) => (
          <button
            key={chip}
            onClick={() => handleChip(chip)}
            className="flex-shrink-0 px-2.5 py-1 rounded-full bg-white/80 border border-line text-[9px] font-medium text-muted hover:text-accent-deep hover:border-accent/30 transition-all whitespace-nowrap"
          >
            {chip}
          </button>
        ))}
      </div>

      {/* Input Bar */}
      <div className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white/95 backdrop-blur-xl border border-line shadow-pop hover:border-accent/30 transition-colors focus-within:border-accent/40 focus-within:shadow-cmd-glow">
        <Search size={14} className="text-muted flex-shrink-0" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
          placeholder="Search alerts and commands..."
          className="flex-1 bg-transparent text-xs text-ink placeholder:text-muted/50 outline-none"
        />
        <button
          onClick={() => handleSubmit()}
          disabled={!query.trim() || loading}
          className="flex items-center justify-center h-7 w-7 rounded-full bg-accent/15 text-accent-deep hover:bg-accent/25 disabled:opacity-30 disabled:hover:bg-accent/15 transition-all"
        >
          {loading ? (
            <Loader2 size={12} className="animate-spin" />
          ) : (
            <Send size={12} />
          )}
        </button>
      </div>
    </motion.div>
  );
}
