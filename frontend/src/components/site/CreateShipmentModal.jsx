import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Sparkles, Loader2, Check, Wand2 } from "lucide-react";
import { toast } from "sonner";
import { aiCreateShipment } from "@/lib/api";
import { addShipment } from "@/lib/shipStore";
import { STATUS } from "@/lib/data";

const EXAMPLES = [
  "Auto parts from Stuttgart to Detroit by air, in transit",
  "Furniture Ho Chi Minh City to Los Angeles by ocean, delayed at customs",
  "Pharma Basel to Singapore multimodal, held for inspection",
];

const MODES = ["Road", "Ocean", "Air", "Rail", "Multimodal"];

export default function CreateShipmentModal({ open, onClose, onCreated }) {
  const [tab, setTab] = useState("ai");
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState(null);
  const [manual, setManual] = useState({ origin: "", destination: "", mode: "Ocean", carrier: "", status: "in_transit", eta: "" });

  const close = () => {
    onClose();
    setTimeout(() => { setPreview(null); setPrompt(""); setLoading(false); }, 250);
  };

  const runAI = async (p) => {
    const text = p || prompt;
    if (!text.trim()) { toast.error("Describe the shipment first."); return; }
    setLoading(true);
    try {
      const s = await aiCreateShipment(text);
      setPreview(s);
    } catch {
      toast.error("AI couldn't build that. Try rephrasing.");
    } finally {
      setLoading(false);
    }
  };

  const confirmAdd = (s) => {
    const saved = addShipment(s);
    toast.success(`Shipment ${saved.id} created`);
    onCreated && onCreated(saved.id);
    close();
  };

  const submitManual = (e) => {
    e.preventDefault();
    if (!manual.origin || !manual.destination) { toast.error("Origin and destination are required."); return; }
    // Build a minimal shipment; AI enriches coordinates if available, else fallback simple 2-stop
    runManual();
  };

  const runManual = async () => {
    setLoading(true);
    try {
      const p = `${manual.mode} shipment from ${manual.origin} to ${manual.destination}, carrier ${manual.carrier || "any"}, status ${manual.status}${manual.eta ? ", ETA " + manual.eta : ""}`;
      const s = await aiCreateShipment(p);
      // honor user's explicit choices
      s.mode = manual.mode; s.status = manual.status;
      if (manual.carrier) s.carrier = manual.carrier;
      if (manual.eta) s.eta = manual.eta;
      confirmAdd(s);
    } catch {
      toast.error("Couldn't geocode that route. Check city names.");
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-[100] flex items-center justify-center p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} data-testid="create-shipment-modal">
          <div className="absolute inset-0 bg-ct-ink/40 backdrop-blur-sm" onClick={close} />
          <motion.div className="relative bg-white w-full max-w-xl border border-ct-line" initial={{ scale: 0.96, y: 20, opacity: 0 }} animate={{ scale: 1, y: 0, opacity: 1 }} exit={{ scale: 0.96, y: 20, opacity: 0 }} transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}>
            <button onClick={close} className="absolute right-4 top-4 text-ct-gray3 hover:text-ct-ink z-10" data-testid="create-close"><X size={20} /></button>

            <div className="p-8">
              <span className="font-mono text-[11px] tracking-[0.25em] uppercase text-ct-orange flex items-center gap-2"><Sparkles size={13} /> Create Shipment</span>
              <h3 className="font-display text-2xl md:text-3xl tracking-tight text-ct-ink mt-2 mb-5">Add a shipment to your tower.</h3>

              <div className="flex gap-1 mb-5 border border-ct-line p-1 w-fit">
                {[["ai", "AI Assistant"], ["manual", "Manual"]].map(([k, l]) => (
                  <button key={k} onClick={() => { setTab(k); setPreview(null); }} className={`font-mono text-[11px] tracking-wide uppercase px-4 py-2 transition-colors ${tab === k ? "bg-ct-ink text-white" : "text-ct-gray2 hover:text-ct-ink"}`} data-testid={`create-tab-${k}`}>{l}</button>
                ))}
              </div>

              {tab === "ai" && !preview && (
                <div>
                  <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} rows={3} placeholder="Describe the shipment in plain English — origin, destination, mode, status…" className="w-full border border-ct-line px-3.5 py-3 text-sm focus:outline-none focus:border-ct-ink resize-none" data-testid="ai-prompt" />
                  <div className="flex flex-wrap gap-2 mt-3">
                    {EXAMPLES.map((ex) => (
                      <button key={ex} onClick={() => { setPrompt(ex); runAI(ex); }} className="text-[11px] border border-ct-line px-2.5 py-1.5 text-ct-gray2 hover:border-ct-ink hover:text-ct-ink transition-colors text-left" data-testid="ai-example">{ex}</button>
                    ))}
                  </div>
                  <button onClick={() => runAI()} disabled={loading} className="mt-4 w-full bg-ct-orange text-white text-sm font-medium py-3 hover:bg-ct-orangehover transition-colors disabled:opacity-60 inline-flex items-center justify-center gap-2" data-testid="ai-generate">
                    {loading ? <><Loader2 size={16} className="animate-spin" /> Routing…</> : <><Wand2 size={16} /> Generate with AI</>}
                  </button>
                </div>
              )}

              {tab === "manual" && (
                <form onSubmit={submitManual} className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <input value={manual.origin} onChange={(e) => setManual({ ...manual, origin: e.target.value })} placeholder="Origin city*" className="border border-ct-line px-3.5 py-2.5 text-sm focus:outline-none focus:border-ct-ink" data-testid="manual-origin" />
                    <input value={manual.destination} onChange={(e) => setManual({ ...manual, destination: e.target.value })} placeholder="Destination city*" className="border border-ct-line px-3.5 py-2.5 text-sm focus:outline-none focus:border-ct-ink" data-testid="manual-destination" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <select value={manual.mode} onChange={(e) => setManual({ ...manual, mode: e.target.value })} className="border border-ct-line px-3.5 py-2.5 text-sm text-ct-gray2 focus:outline-none focus:border-ct-ink" data-testid="manual-mode">
                      {MODES.map((m) => <option key={m}>{m}</option>)}
                    </select>
                    <select value={manual.status} onChange={(e) => setManual({ ...manual, status: e.target.value })} className="border border-ct-line px-3.5 py-2.5 text-sm text-ct-gray2 focus:outline-none focus:border-ct-ink" data-testid="manual-status">
                      {Object.entries(STATUS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <input value={manual.carrier} onChange={(e) => setManual({ ...manual, carrier: e.target.value })} placeholder="Carrier (optional)" className="border border-ct-line px-3.5 py-2.5 text-sm focus:outline-none focus:border-ct-ink" data-testid="manual-carrier" />
                    <input value={manual.eta} onChange={(e) => setManual({ ...manual, eta: e.target.value })} placeholder="ETA e.g. Aug 24, 2026" className="border border-ct-line px-3.5 py-2.5 text-sm focus:outline-none focus:border-ct-ink" data-testid="manual-eta" />
                  </div>
                  <button type="submit" disabled={loading} className="w-full bg-ct-ink text-white text-sm font-medium py-3 hover:bg-ct-orange transition-colors disabled:opacity-60 inline-flex items-center justify-center gap-2" data-testid="manual-create">
                    {loading ? <><Loader2 size={16} className="animate-spin" /> Building route…</> : "Create shipment"}
                  </button>
                  <p className="text-[11px] text-ct-gray3">AI auto-plots realistic route stops &amp; coordinates from your cities.</p>
                </form>
              )}

              {preview && (
                <div data-testid="ai-preview">
                  <div className="border border-ct-line">
                    <div className="flex items-center justify-between px-4 py-3 border-b border-ct-line bg-ct-bg2">
                      <span className="font-mono text-sm font-semibold text-ct-ink">{preview.id}</span>
                      <span className="flex items-center gap-1.5 font-mono text-[11px]" style={{ color: STATUS[preview.status]?.color }}>
                        <span className="h-1.5 w-1.5 rounded-full" style={{ background: STATUS[preview.status]?.color }} />{STATUS[preview.status]?.label || preview.status}
                      </span>
                    </div>
                    <div className="p-4">
                      <div className="text-sm font-medium text-ct-ink">{preview.origin} → {preview.destination}</div>
                      <div className="font-mono text-[11px] text-ct-gray3 mt-1">{preview.mode} · {preview.carrier} · ETA {preview.eta}</div>
                      <div className="flex flex-wrap gap-1.5 mt-3">
                        {preview.stops?.map((s, i) => (
                          <span key={i} className="text-[10px] font-mono border border-ct-line px-2 py-1 text-ct-gray2">{s.city} · {s.event}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-4">
                    <button onClick={() => confirmAdd(preview)} className="flex-1 bg-ct-orange text-white text-sm font-medium py-3 hover:bg-ct-orangehover transition-colors inline-flex items-center justify-center gap-2" data-testid="ai-confirm"><Check size={16} /> Add to tower</button>
                    <button onClick={() => setPreview(null)} className="border border-ct-line text-ct-ink text-sm px-5 hover:border-ct-ink transition-colors" data-testid="ai-retry">Retry</button>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
