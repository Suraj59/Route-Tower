import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Check, MapPin, Ship, Package, Clock, TriangleAlert, FileCheck } from "lucide-react";
import Header from "@/components/site/Header";
import DemoModal from "@/components/site/DemoModal";
import WorldMap from "@/components/site/WorldMap";
import { SHIPMENTS, STATUS, JOURNEY } from "@/lib/data";

const EVENTS = [
  { t: "Aug 02 · 09:14", label: "Picked Up", loc: "Shenzhen — Supplier Dock", type: "ok" },
  { t: "Aug 02 · 18:40", label: "Arrived Origin Facility", loc: "Shenzhen Bonded Warehouse", type: "ok" },
  { t: "Aug 03 · 11:22", label: "Export Customs Cleared", loc: "Shenzhen Customs", type: "customs" },
  { t: "Aug 04 · 07:05", label: "Gate-in at Port", loc: "Yantian Port Terminal", type: "port" },
  { t: "Aug 04 · 22:30", label: "Vessel Departed", loc: "MV Nordic Star · Voyage 214E", type: "ok" },
  { t: "Aug 09 · 03:10", label: "Ocean Transit Update", loc: "Pacific Ocean — mid-voyage", type: "transit" },
];

export default function ShipmentDetail() {
  const { id } = useParams();
  const [demo, setDemo] = useState(false);
  const s = SHIPMENTS.find((x) => x.id === id) || SHIPMENTS[0];
  const st = STATUS[s.status];

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
              <span className="font-mono text-[11px] tracking-[0.2em] uppercase text-ct-gray3">Shipment</span>
              <h1 className="font-display text-4xl md:text-5xl tracking-tighter text-ct-ink">{s.id}</h1>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 border" style={{ borderColor: st.color, color: st.color }}>
              <span className="h-2 w-2 rounded-full" style={{ background: st.color }} />
              <span className="font-mono text-sm tracking-wide">{st.label.toUpperCase()}</span>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-5 divide-x divide-ct-line">
            {[
              ["Origin", s.origin, MapPin],
              ["Destination", s.destination, MapPin],
              ["ETA", s.eta, Clock],
              ["Carrier", s.carrier, Ship],
              ["Tracking #", s.tracking, Package],
            ].map(([k, v, Icon]) => (
              <div key={k} className="p-5">
                <div className="flex items-center gap-1.5 font-mono text-[10px] tracking-[0.15em] uppercase text-ct-gray3 mb-2">
                  <Icon size={12} />{k}
                </div>
                <div className="text-sm font-medium text-ct-ink break-words">{v}</div>
              </div>
            ))}
          </div>
        </motion.div>

        <div className="grid md:grid-cols-12 gap-4 mt-4">
          {/* Journey */}
          <div className="md:col-span-4 border border-ct-line bg-white p-6" data-testid="journey-panel">
            <div className="font-mono text-[11px] tracking-[0.2em] uppercase text-ct-gray3 mb-6">Journey</div>
            <div className="relative">
              <div className="absolute left-[11px] top-1 bottom-1 w-px bg-ct-line" />
              <div className="space-y-5">
                {JOURNEY.map((j) => (
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
                <span className="font-mono text-[11px] tracking-[0.2em] uppercase text-ct-gray3">Current Location</span>
                <span className="text-sm text-ct-ink font-medium">{s.current}</span>
              </div>
              <div className="bg-ct-bg2"><WorldMap shipments={[s]} activeId={s.id} onSelect={() => {}} /></div>
            </div>

            {(s.status === "delayed" || s.status === "held" || s.status === "exception") && (
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
                {EVENTS.map((e, i) => (
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
    </div>
  );
}
