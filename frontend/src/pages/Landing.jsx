import { useState, useRef } from "react";
import { Link } from "react-router-dom";
import { motion, useScroll, useTransform } from "framer-motion";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import Header from "@/components/site/Header";
import Footer from "@/components/site/Footer";
import DemoModal from "@/components/site/DemoModal";
import WorldMap from "@/components/site/WorldMap";
import {
  Marquee, Problem, Solution, Journey, MultiModal, Normalization,
  Exceptions, Orchestration, CustomerExperience, Architecture, Impact, FinalCTA,
} from "@/components/site/Sections";
import NotificationPreview from "@/components/site/NotificationPreview";
import Countdown from "@/components/site/Countdown";
import { STATUS } from "@/lib/data";
import { useShipments } from "@/lib/shipStore";

const heroLines = ["Track Every Shipment.", "Across Every Mile."];

const lineVariant = {
  hidden: { y: "110%" },
  show: (i) => ({ y: "0%", transition: { duration: 0.9, delay: 0.15 + i * 0.12, ease: [0.16, 1, 0.3, 1] } }),
};

function Hero({ onDemo }) {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], [0, 120]);

  return (
    <section ref={ref} className="relative pt-32 md:pt-40 pb-20 overflow-hidden grid-lines" data-testid="hero">
      <div className="max-w-[1400px] mx-auto px-6 md:px-10">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}>
          <span className="font-mono text-[11px] tracking-[0.25em] uppercase text-ct-orange">
            One Route Tower · Every Shipment · Every Mile · Every Event
          </span>
        </motion.div>

        <h1 className="font-display font-extrabold text-[13vw] leading-[0.9] md:text-[7.5vw] lg:text-8xl tracking-tighter text-ct-ink mt-6">
          {heroLines.map((line, i) => (
            <span key={i} className="reveal-mask">
              <motion.span className="block" custom={i} variants={lineVariant} initial="hidden" animate="show">
                {i === 1 ? <>Across <span className="text-ct-orange">Every Mile.</span></> : line}
              </motion.span>
            </span>
          ))}
        </h1>

        <div className="grid md:grid-cols-12 gap-8 mt-10 items-end">
          <motion.p
            className="md:col-span-6 text-lg text-ct-gray2 leading-relaxed"
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6, duration: 0.7 }}
          >
            Route Tower gives enterprises a single, intelligent view of shipments across carriers, modes, facilities, ports, customs and last-mile networks.
            <span className="block mt-3 text-sm text-ct-ink font-medium">All your shipments — controlled from one Tower.</span>
          </motion.p>
          <motion.div
            className="md:col-span-6 flex flex-wrap gap-3 md:justify-end"
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.72, duration: 0.7 }}
          >
            <button onClick={onDemo} className="bg-ct-ink text-white text-sm font-medium px-6 py-3.5 hover:bg-ct-orange transition-colors inline-flex items-center gap-2" data-testid="hero-demo-btn">
              Request a Demo <ArrowRight size={16} />
            </button>
            <Link to="/dashboard" className="border border-ct-line text-ct-ink text-sm font-medium px-6 py-3.5 hover:border-ct-ink transition-colors inline-flex items-center gap-2" data-testid="hero-explore-btn">
              Explore Route Tower <ArrowUpRight size={16} />
            </Link>
          </motion.div>
        </div>
      </div>

      {/* Interactive map */}
      <motion.div style={{ y }} className="max-w-[1400px] mx-auto px-6 md:px-10 mt-16">
        <MapPanel onDemo={onDemo} />
      </motion.div>
    </section>
  );
}

function MapPanel() {
  const shipments = useShipments();
  const [active, setActive] = useState(shipments[0]?.id);
  return (
    <div className="border border-ct-line bg-white" data-testid="map-panel">
      <div className="flex items-center justify-between px-5 py-3 border-b border-ct-line">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-status-delivered animate-pulse" />
          <span className="font-mono text-[11px] tracking-[0.2em] uppercase text-ct-gray3">Live Shipment Map · Demo Data</span>
        </div>
        <div className="hidden sm:flex items-center gap-3">
          {Object.entries(STATUS).map(([k, v]) => (
            <span key={k} className="flex items-center gap-1.5 font-mono text-[10px] tracking-wide text-ct-gray2">
              <span className="h-2 w-2 rounded-full" style={{ background: v.color }} />{v.label}
            </span>
          ))}
        </div>
      </div>
      <div className="grid md:grid-cols-12">
        <div className="md:col-span-8 border-b md:border-b-0 md:border-r border-ct-line bg-ct-bg2">
          <WorldMap shipments={shipments} activeId={active} onSelect={setActive} />
        </div>
        <div className="md:col-span-4 p-4 space-y-2 max-h-[420px] overflow-y-auto">
          {shipments.map((s) => {
            const st = STATUS[s.status];
            return (
              <button
                key={s.id}
                onClick={() => setActive(s.id)}
                className={`w-full text-left border p-3.5 transition-all ${active === s.id ? "border-ct-ink bg-ct-bg2" : "border-ct-line hover:border-ct-gray3"}`}
                data-testid={`ship-item-${s.id}`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-mono text-xs font-semibold text-ct-ink flex items-center gap-1.5">
                    {s.id}{s.createdByUser && <span className="text-[9px] text-ct-orange border border-ct-orange/40 px-1">NEW</span>}
                  </span>
                  <span className="flex items-center gap-1.5 font-mono text-[10px] tracking-wide" style={{ color: st.color }}>
                    <span className="h-1.5 w-1.5 rounded-full" style={{ background: st.color }} />{st.label}
                  </span>
                </div>
                <div className="text-sm text-ct-ink font-medium">{s.origin} → {s.destination}</div>
                <div className="font-mono text-[10px] text-ct-gray3 mt-1 flex items-center gap-2">
                  <span>{s.mode}</span><span className="text-ct-line">|</span>
                  <Countdown eta={s.eta} status={s.status} compact className="text-ct-gray2" />
                </div>
              </button>
            );
          })}
          <Link to={`/shipment/${active}`} className="block text-center border border-ct-ink text-ct-ink text-sm font-medium py-2.5 hover:bg-ct-ink hover:text-white transition-colors mt-2" data-testid="view-shipment-detail">
            View shipment detail
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function Landing() {
  const [demo, setDemo] = useState(false);
  const openDemo = () => setDemo(true);
  return (
    <div className="bg-white">
      <Header onDemo={openDemo} />
      <Hero onDemo={openDemo} />
      <Marquee />
      <Problem />
      <Solution />
      <Journey />
      <MultiModal />
      <Normalization />
      <Exceptions />
      <Orchestration />
      <CustomerExperience />
      <NotificationPreview />
      <Architecture />
      <Impact />
      <FinalCTA onDemo={openDemo} />
      <Footer onDemo={openDemo} />
      <DemoModal open={demo} onClose={() => setDemo(false)} />
    </div>
  );
}
