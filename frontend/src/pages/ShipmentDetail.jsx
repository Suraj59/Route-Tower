import { useState, useMemo, useEffect, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Check, MapPin, Ship, Package, Clock, TriangleAlert, FileCheck, Play, Pause, Sparkles, Loader2, RotateCcw, Link2, QrCode } from "lucide-react";
import Header from "@/components/site/Header";
import DemoModal from "@/components/site/DemoModal";
import QRModal from "@/components/site/QRModal";
import WorldMap from "@/components/site/WorldMap";
import Countdown from "@/components/site/Countdown";
import { STATUS, JOURNEY } from "@/lib/data";
import { useShipments } from "@/lib/shipStore";
import { aiInsight } from "@/lib/api";
import { trackingLink } from "@/lib/share";
import { toast } from "sonner";

const SEED_EVENTS = [
  { t: "Aug 02 · 09:14", label: "Picked Up", loc: "Origin — Supplier Dock" },
  { t: "Aug 02 · 18:40", label: "Arrived Origin Facility", loc: "Bonded Warehouse" },
  { t: "Aug 03 · 11:22", label: "Export Customs Cleared", loc: "Origin Customs" },
  { t: "Aug 04 · 07:05", label: "Gate-in at Port", loc: "Port Terminal" },
  { t: "Aug 04 · 22:30", label: "Vessel Departed", loc: "Voyage 214E" },
  { t: "Aug 09 · 03:10", label: "In Transit Update", loc: "Mid-voyage" },
];

export default function ShipmentDetail() {
  const { id } = useParams();
  const shipments = useShipments();
  const [demo, setDemo] = useState(false);
  const [qr, setQr] = useState(false);
  const s = shipments.find((x) => x.id === id) || shipments[0];
  const st = STATUS[s.status];

  // journey: created shipments derive from stops; seeds use static JOURNEY
  const journey = useMemo(() => {
    if (s.createdByUser && s.stops) {
      const n = s.stops.length;
      const activeIdx = s.status === "delivered" ? n - 1 : Math.max(0, Math.floor(n * 0.6));
      return s.stops.map((p, i) => ({
        key: `${p.city}-${i}`,
        label: `${p.event} · ${p.city}`,
        done: i < activeIdx,
        active: i === activeIdx && s.status !== "delivered",
      }));
    }
    return JOURNEY;
  }, [s]);

  const events = useMemo(() => {
    if (s.createdByUser && s.stops) {
      return s.stops.map((p, i) => ({ t: `Stop ${i + 1}`, label: p.event, loc: `${p.city}, ${p.country}` }));
    }
    return SEED_EVENTS;
  }, [s]);

  // Route playback
  const [progress, setProgress] = useState(0.55);
  const [playing, setPlaying] = useState(false);
  const raf = useRef();
  useEffect(() => {
    if (!playing) return;
    let last = performance.now();
    const loop = (now) => {
      const dt = (now - last) / 1000; last = now;
      setProgress((p) => {
        const np = p + dt / 8;
        if (np >= 1) { setPlaying(false); return 1; }
        return np;
      });
      raf.current = requestAnimationFrame(loop);
    };
    raf.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf.current);
  }, [playing]);

  // AI co-pilot
  const [insight, setInsight] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [question, setQuestion] = useState("");
  const askAI = async (q) => {
    setAiLoading(true);
    try {
      const text = await aiInsight(s, q);
      setInsight(text);
    } catch {
      setInsight("AI co-pilot is unavailable right now. Please try again.");
    } finally {
      setAiLoading(false);
    }
  };

  const isException = s.status === "delayed" || s.status === "held" || s.status === "exception";

  return (
    <div className="bg-ct-bg2 min-h-screen">
      <Header onDemo={() => setDemo(true)} />
      <div className="max-w-[1400px] mx-auto px-6 md:px-10 pt-24 pb-20">
        <Link to="/dashboard" className="inline-flex items-center gap-2 text-sm text-ct-gray2 hover:text-ct-ink transition-colors mb-6" data-testid="back-to-dashboard">
          <ArrowLeft size={16} /> Back to dashboard
        </Link>

        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="border border-ct-line bg-white" data-testid="shipment-header">
          <div className="flex flex-wrap items-center justify-between gap-4 p-6 border-b border-ct-line">
            <div>
              <span className="font-mono text-[11px] tracking-[0.2em] uppercase text-ct-gray3">Shipment{s.createdByUser ? " · Created by you" : ""}</span>
              <h1 className="font-display text-4xl md:text-5xl tracking-tighter text-ct-ink">{s.id}</h1>
            </div>
            <div className="flex items-center gap-6">
              <button
                onClick={() => { navigator.clipboard?.writeText(trackingLink(s)); toast.success("Public tracking link copied"); }}
                className="inline-flex items-center gap-2 border border-ct-line text-ct-ink text-sm px-4 py-2.5 hover:border-ct-ink transition-colors"
                data-testid="copy-track-link"
              >
                <Link2 size={15} /> Copy tracking link
              </button>
              <button
                onClick={() => setQr(true)}
                className="inline-flex items-center gap-2 border border-ct-line text-ct-ink text-sm px-4 py-2.5 hover:border-ct-ink transition-colors"
                data-testid="show-qr-btn"
              >
                <QrCode size={15} /> QR
              </button>
              <div className="text-right">
                <div className="font-mono text-[10px] tracking-[0.2em] uppercase text-ct-gray3 mb-1">Live ETA Countdown</div>
                <Countdown eta={s.eta} status={s.status} className="text-2xl text-ct-ink" />
              </div>
              <div className="flex items-center gap-2 px-4 py-2 border" style={{ borderColor: st.color, color: st.color }}>
                <span className="h-2 w-2 rounded-full" style={{ background: st.color }} />
                <span className="font-mono text-sm tracking-wide">{st.label.toUpperCase()}</span>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-5 divide-x divide-ct-line">
            {[["Origin", s.origin, MapPin], ["Destination", s.destination, MapPin], ["ETA", s.eta, Clock], ["Carrier", s.carrier, Ship], ["Tracking #", s.tracking, Package]].map(([k, v, Icon]) => (
              <div key={k} className="p-5">
                <div className="flex items-center gap-1.5 font-mono text-[10px] tracking-[0.15em] uppercase text-ct-gray3 mb-2"><Icon size={12} />{k}</div>
                <div className="text-sm font-medium text-ct-ink break-words">{v}</div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* AI Co-pilot */}
        <div className="border border-ct-line bg-ct-ink text-white mt-4" data-testid="ai-copilot">
          <div className="px-5 py-3 border-b border-white/10 flex items-center gap-2">
            <Sparkles size={16} className="text-ct-orange" />
            <span className="font-mono text-[11px] tracking-[0.2em] uppercase text-white/60">AI Tracking Co-Pilot · Gemini</span>
          </div>
          <div className="p-5">
            {insight ? (
              <p className="text-sm leading-relaxed text-white/90" data-testid="ai-insight-text">{insight}</p>
            ) : (
              <p className="text-sm text-white/50">Ask the AI to assess risk, predict the next milestone and recommend an action for this shipment.</p>
            )}
            <div className="flex flex-wrap items-center gap-2 mt-4">
              <button onClick={() => askAI()} disabled={aiLoading} className="bg-ct-orange text-white text-sm font-medium px-4 py-2.5 hover:bg-ct-orangehover transition-colors disabled:opacity-60 inline-flex items-center gap-2" data-testid="ai-analyze-btn">
                {aiLoading ? <><Loader2 size={15} className="animate-spin" /> Analyzing…</> : <><Sparkles size={15} /> Analyze shipment</>}
              </button>
              <input value={question} onChange={(e) => setQuestion(e.target.value)} onKeyDown={(e) => e.key === "Enter" && question && askAI(question)} placeholder="Ask a question… e.g. Will it clear customs in time?" className="flex-1 min-w-[220px] bg-white/5 border border-white/15 px-3.5 py-2.5 text-sm text-white placeholder:text-white/40 focus:outline-none focus:border-ct-orange" data-testid="ai-question" />
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-12 gap-4 mt-4">
          {/* Journey */}
          <div className="md:col-span-4 border border-ct-line bg-white p-6" data-testid="journey-panel">
            <div className="font-mono text-[11px] tracking-[0.2em] uppercase text-ct-gray3 mb-6">Journey</div>
            <div className="relative">
              <div className="absolute left-[11px] top-1 bottom-1 w-px bg-ct-line" />
              <div className="space-y-5">
                {journey.map((j) => (
                  <div key={j.key} className="relative flex items-center gap-4">
                    <div className={`relative z-10 h-6 w-6 rounded-full grid place-items-center shrink-0 ${j.done ? "bg-status-delivered text-white" : j.active ? "bg-ct-orange text-white" : "bg-white border border-ct-line text-ct-gray3"}`}>
                      {j.done ? <Check size={13} /> : <span className="h-1.5 w-1.5 rounded-full bg-current" />}
                    </div>
                    <span className={`text-sm ${j.done || j.active ? "text-ct-ink font-medium" : "text-ct-gray3"}`}>{j.label}</span>
                    {j.active && <span className="ml-auto font-mono text-[10px] text-ct-orange">CURRENT</span>}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right column */}
          <div className="md:col-span-8 space-y-4">
            <div className="border border-ct-line bg-white" data-testid="location-panel">
              <div className="px-5 py-3 border-b border-ct-line flex items-center justify-between">
                <span className="font-mono text-[11px] tracking-[0.2em] uppercase text-ct-gray3">Route Playback</span>
                <span className="text-sm text-ct-ink font-medium">{s.current}</span>
              </div>
              <div className="bg-ct-bg2">
                <WorldMap shipments={[s]} activeId={s.id} onSelect={() => {}} animate={false} playbackProgress={progress} />
              </div>
              {/* Playback controls */}
              <div className="flex items-center gap-4 px-5 py-3 border-t border-ct-line" data-testid="playback-controls">
                <button onClick={() => { if (progress >= 1) setProgress(0); setPlaying((p) => !p); }} className="h-9 w-9 grid place-items-center bg-ct-ink text-white hover:bg-ct-orange transition-colors" data-testid="playback-play">
                  {playing ? <Pause size={16} /> : <Play size={16} />}
                </button>
                <button onClick={() => { setProgress(0); setPlaying(false); }} className="h-9 w-9 grid place-items-center border border-ct-line text-ct-gray2 hover:text-ct-ink hover:border-ct-ink transition-colors" data-testid="playback-reset">
                  <RotateCcw size={15} />
                </button>
                <input type="range" min={0} max={100} value={Math.round(progress * 100)} onChange={(e) => { setPlaying(false); setProgress(Number(e.target.value) / 100); }} className="flex-1 accent-ct-orange" data-testid="playback-scrub" />
                <span className="font-mono text-xs text-ct-gray2 w-12 text-right">{Math.round(progress * 100)}%</span>
              </div>
            </div>

            {isException && (
              <div className="border border-status-exception/30 bg-red-50/50" data-testid="exception-panel">
                <div className="px-5 py-3 border-b border-status-exception/20 flex items-center gap-2">
                  <TriangleAlert size={16} className="text-status-exception" />
                  <span className="font-display text-lg tracking-tight text-ct-ink">Active Exception</span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-status-exception/10">
                  {[["Reason", "Customs Clearance Delay"], ["Location", s.current], ["Impact", "ETA +2 days"], ["Action", "Documentation required"]].map(([k, v]) => (
                    <div key={k} className="p-5">
                      <div className="font-mono text-[10px] tracking-[0.15em] uppercase text-ct-gray3 mb-2">{k}</div>
                      <div className="text-sm font-medium text-ct-ink">{v}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="border border-ct-line bg-white" data-testid="events-panel">
              <div className="px-5 py-3 border-b border-ct-line flex items-center justify-between">
                <span className="font-mono text-[11px] tracking-[0.2em] uppercase text-ct-gray3">Event History</span>
                <span className="flex items-center gap-1.5 font-mono text-[10px] text-status-delivered"><FileCheck size={12} /> POD on delivery</span>
              </div>
              <div className="divide-y divide-ct-line">
                {events.map((e, i) => (
                  <motion.div key={i} initial={{ opacity: 0, x: -8 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.05 }} className="flex items-center gap-4 px-5 py-3.5">
                    <span className="font-mono text-[11px] text-ct-gray3 w-28 shrink-0">{e.t}</span>
                    <span className="h-2 w-2 rounded-full bg-ct-orange shrink-0" />
                    <span className="text-sm font-medium text-ct-ink">{e.label}</span>
                    <span className="ml-auto text-sm text-ct-gray2 text-right hidden sm:block">{e.loc}</span>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
      <DemoModal open={demo} onClose={() => setDemo(false)} />
      <QRModal open={qr} onClose={() => setQr(false)} shipment={s} />
    </div>
  );
}
