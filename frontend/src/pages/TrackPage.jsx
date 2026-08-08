import { useMemo } from "react";
import { useParams, useSearchParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Radar, Check, MapPin, Clock, ShieldCheck } from "lucide-react";
import WorldMap from "@/components/site/WorldMap";
import Countdown from "@/components/site/Countdown";
import { STATUS } from "@/lib/data";
import { useShipments } from "@/lib/shipStore";
import { decodeShipment } from "@/lib/share";

export default function TrackPage() {
  const { id } = useParams();
  const [params] = useSearchParams();
  const shipments = useShipments();

  const s = useMemo(() => {
    const d = params.get("d");
    if (d) {
      const decoded = decodeShipment(d);
      if (decoded) return decoded;
    }
    return shipments.find((x) => x.id === id) || null;
  }, [id, params, shipments]);

  if (!s) {
    return (
      <div className="min-h-screen bg-ct-bg2 grid place-items-center px-6">
        <div className="text-center">
          <h1 className="font-display text-3xl tracking-tight text-ct-ink">Shipment not found</h1>
          <p className="text-ct-gray2 mt-2">This tracking link may have expired.</p>
          <Link to="/" className="inline-block mt-6 bg-ct-ink text-white text-sm px-6 py-3 hover:bg-ct-orange transition-colors">Go to Route Tower</Link>
        </div>
      </div>
    );
  }

  const st = STATUS[s.status] || STATUS.in_transit;
  const stops = s.stops || (s.route || []).map((c) => ({ city: c, event: "" }));
  const activeIdx = s.status === "delivered" ? stops.length - 1 : Math.max(0, Math.floor(stops.length * 0.6));

  return (
    <div className="min-h-screen bg-ct-bg2">
      {/* Minimal public header */}
      <header className="bg-white border-b border-ct-line">
        <div className="max-w-3xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="h-8 w-8 bg-ct-ink text-ct-orange grid place-items-center"><Radar size={18} strokeWidth={1.8} /></div>
            <span className="font-display font-extrabold text-[15px] tracking-tight text-ct-ink">Route Tower<span className="text-ct-orange">.</span></span>
          </Link>
          <span className="flex items-center gap-1.5 font-mono text-[10px] tracking-[0.2em] uppercase text-ct-gray3"><ShieldCheck size={13} /> Public Tracking</span>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-6 py-10">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="border border-ct-line bg-white" data-testid="track-card">
          <div className="p-6 border-b border-ct-line">
            <span className="font-mono text-[11px] tracking-[0.2em] uppercase text-ct-gray3">Tracking</span>
            <div className="flex flex-wrap items-center justify-between gap-3 mt-1">
              <h1 className="font-display text-4xl tracking-tighter text-ct-ink">{s.id}</h1>
              <div className="flex items-center gap-2 px-4 py-2 border" style={{ borderColor: st.color, color: st.color }}>
                <span className="h-2 w-2 rounded-full" style={{ background: st.color }} />
                <span className="font-mono text-sm tracking-wide">{st.label.toUpperCase()}</span>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 mt-4 text-sm">
              <span className="flex items-center gap-1.5 text-ct-gray2"><MapPin size={14} className="text-ct-orange" />{s.origin} → {s.destination}</span>
              <span className="flex items-center gap-1.5 text-ct-gray2"><Clock size={14} className="text-ct-orange" />ETA {s.eta}</span>
            </div>
            <div className="mt-4 flex items-center gap-3">
              <span className="font-mono text-[10px] tracking-[0.2em] uppercase text-ct-gray3">Arriving in</span>
              <Countdown eta={s.eta} status={s.status} className="text-xl text-ct-ink" />
            </div>
          </div>

          <div className="bg-ct-bg2 border-b border-ct-line">
            <WorldMap shipments={[s]} activeId={s.id} onSelect={() => {}} />
          </div>

          <div className="p-6">
            <div className="font-mono text-[11px] tracking-[0.2em] uppercase text-ct-gray3 mb-5">Journey</div>
            <div className="relative">
              <div className="absolute left-[11px] top-1 bottom-1 w-px bg-ct-line" />
              <div className="space-y-5">
                {stops.map((p, i) => {
                  const done = i < activeIdx, active = i === activeIdx && s.status !== "delivered";
                  return (
                    <div key={i} className="relative flex items-center gap-4">
                      <div className={`relative z-10 h-6 w-6 rounded-full grid place-items-center shrink-0 ${done ? "bg-status-delivered text-white" : active ? "bg-ct-orange text-white" : "bg-white border border-ct-line text-ct-gray3"}`}>
                        {done ? <Check size={13} /> : <span className="h-1.5 w-1.5 rounded-full bg-current" />}
                      </div>
                      <span className={`text-sm ${done || active ? "text-ct-ink font-medium" : "text-ct-gray3"}`}>{p.event ? `${p.event} · ` : ""}{p.city}</span>
                      {active && <span className="ml-auto font-mono text-[10px] text-ct-orange">CURRENT</span>}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </motion.div>
        <p className="text-center font-mono text-[10px] tracking-wide text-ct-gray3 mt-6">POWERED BY ROUTE TOWER · READ-ONLY TRACKING</p>
      </div>
    </div>
  );
}
