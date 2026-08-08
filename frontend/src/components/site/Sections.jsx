import { motion } from "framer-motion";
import { Reveal, MonoLabel, SectionTag } from "./Primitives";
import {
  Layers, GitBranch, ShieldAlert, Workflow, Bell, Network,
  Truck, Ship, Plane, Train, ArrowRight, Check, TriangleAlert,
} from "lucide-react";
import { LIFECYCLE, SHIPMENTS } from "@/lib/data";

/* ---------- Editorial Marquee ---------- */
export const Marquee = () => {
  const items = [
    "NEW YORK → LONDON [DELIVERED]", "SHENZHEN → CHICAGO [IN TRANSIT]",
    "MUMBAI → ROTTERDAM [DELAYED]", "TOKYO → SF [DELIVERED]",
    "SANTOS → HAMBURG [HELD]", "LA → CHICAGO [EXCEPTION]",
    "SHANGHAI → LONDON [IN TRANSIT]", "DUBAI → FRANKFURT [CUSTOMS]",
  ];
  const row = [...items, ...items];
  return (
    <div className="border-y border-ct-line bg-ct-bg2 py-4 overflow-hidden" data-testid="marquee">
      <div className="flex whitespace-nowrap animate-marquee">
        {row.map((t, i) => (
          <span key={i} className="font-mono text-sm tracking-[0.15em] text-ct-gray2 mx-8 flex items-center gap-8">
            {t}<span className="text-ct-orange">+++</span>
          </span>
        ))}
      </div>
    </div>
  );
};

/* ---------- Problem (numbered manifesto) ---------- */
export const Problem = () => (
  <section id="problem" className="max-w-[1400px] mx-auto px-6 md:px-10 py-28 md:py-36">
    <SectionTag n="01">The Problem</SectionTag>
    <div className="grid md:grid-cols-12 gap-10 items-end">
      <div className="md:col-span-8">
        <Reveal>
          <h2 className="font-display text-4xl sm:text-5xl md:text-6xl tracking-tighter leading-[0.95] text-ct-ink">
            Your shipment moves everywhere.
            <br />
            <span className="text-ct-gray3">Your visibility should too.</span>
          </h2>
        </Reveal>
      </div>
      <div className="md:col-span-4">
        <Reveal delay={0.1}>
          <p className="text-ct-gray2 leading-relaxed">
            A single shipment passes through suppliers, ports, customs, terminals and last-mile carriers — each with different tracking numbers, systems and event formats. The result is fragmented, delayed, incomplete visibility.
          </p>
        </Reveal>
      </div>
    </div>

    <Reveal delay={0.15}>
      <div className="mt-16 grid grid-cols-2 md:grid-cols-5 border-t border-l border-ct-line">
        {["Fragmented carrier data", "Multiple tracking numbers", "Different event terminology", "Delayed exception detection", "Manual monitoring"].map((t, i) => (
          <div key={i} className="border-r border-b border-ct-line p-6 min-h-[140px] flex flex-col justify-between group hover:bg-ct-bg2 transition-colors">
            <span className="font-mono text-[11px] text-ct-orange">0{i + 1}</span>
            <span className="text-sm font-medium text-ct-ink leading-snug">{t}</span>
          </div>
        ))}
      </div>
    </Reveal>

    <Reveal delay={0.2}>
      <div className="mt-16 border border-ct-line bg-ct-ink text-white p-10 md:p-14">
        <p className="font-display text-2xl md:text-4xl tracking-tight leading-tight max-w-3xl">
          "Your shipment doesn't move through one system.
          <span className="text-ct-orange"> Neither should your visibility.</span>"
        </p>
      </div>
    </Reveal>
  </section>
);

/* ---------- Solution ---------- */
export const Solution = () => (
  <section id="solution" className="bg-ct-bg2 border-y border-ct-line">
    <div className="max-w-[1400px] mx-auto px-6 md:px-10 py-28 md:py-36">
      <SectionTag n="02">The Solution</SectionTag>
      <div className="grid md:grid-cols-12 gap-10 items-end mb-16">
        <div className="md:col-span-7">
          <Reveal>
            <h2 className="font-display text-4xl sm:text-5xl md:text-6xl tracking-tighter leading-[0.95] text-ct-ink">
              One Control Tower.
              <br />One shipment journey.
            </h2>
          </Reveal>
        </div>
        <div className="md:col-span-5">
          <Reveal delay={0.1}>
            <p className="text-ct-gray2 leading-relaxed">
              We collect tracking events from carriers, providers, webhooks, EDI and enterprise systems — then normalize them into one continuous shipment lifecycle. From tracking, to visibility, to intelligence, to orchestration.
            </p>
          </Reveal>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        {[
          { icon: Layers, t: "Unified Visibility", d: "One view across every carrier, mode and transportation stage." },
          { icon: GitBranch, t: "Multi-Leg Intelligence", d: "Understand the whole load while keeping per-leg visibility." },
          { icon: ShieldAlert, t: "Exception Intelligence", d: "Detect delays, holds and customs issues — with the reason and the next action." },
          { icon: Workflow, t: "Orchestration", d: "Turn shipment events into automated operational workflows." },
          { icon: Bell, t: "Customer Experience", d: "Transparent post-purchase visibility and configurable notifications." },
          { icon: Network, t: "Event Normalization", d: "Convert inconsistent carrier events into a common lifecycle." },
        ].map((c, i) => (
          <Reveal key={i} delay={i * 0.06}>
            <div className="bg-white border border-ct-line p-7 h-full hover:-translate-y-1 hover:shadow-lg transition-all duration-300">
              <c.icon className="text-ct-orange mb-6" strokeWidth={1.5} size={26} />
              <h3 className="font-display text-xl tracking-tight text-ct-ink mb-2">{c.t}</h3>
              <p className="text-sm text-ct-gray2 leading-relaxed">{c.d}</p>
            </div>
          </Reveal>
        ))}
      </div>
    </div>
  </section>
);

/* ---------- End-to-End Journey ---------- */
export const Journey = () => (
  <section id="journey" className="max-w-[1400px] mx-auto px-6 md:px-10 py-28 md:py-36">
    <SectionTag n="03">End-to-End Journey</SectionTag>
    <div className="grid md:grid-cols-12 gap-10 mb-14">
      <div className="md:col-span-7">
        <Reveal>
          <h2 className="font-display text-4xl sm:text-5xl md:text-6xl tracking-tighter leading-[0.95] text-ct-ink">
            First mile. Middle mile. Last mile.
          </h2>
        </Reveal>
      </div>
      <div className="md:col-span-5">
        <Reveal delay={0.1}>
          <p className="text-ct-gray2 leading-relaxed">
            The complete lifecycle — with repeated facility, port, customs and handoff events supported without over-complicating the model.
          </p>
        </Reveal>
      </div>
    </div>

    <Reveal delay={0.15}>
      <div className="grid grid-cols-3 gap-4 mb-10">
        {[
          { t: "First Mile", d: "Supplier → Pickup → Origin Warehouse → Origin Facility" },
          { t: "Middle Mile", d: "Warehouse → Truck → Rail → Port → Ocean → Air → Customs" },
          { t: "Last Mile", d: "Distribution Center → Local Carrier → Out for Delivery" },
        ].map((m, i) => (
          <div key={i} className="border-t-2 border-ct-orange pt-4">
            <div className="font-mono text-[11px] tracking-[0.2em] uppercase text-ct-ink mb-2">{m.t}</div>
            <p className="text-xs md:text-sm text-ct-gray2 leading-relaxed">{m.d}</p>
          </div>
        ))}
      </div>
    </Reveal>

    <div className="flex flex-wrap gap-2">
      {LIFECYCLE.map((step, i) => (
        <Reveal key={step} delay={i * 0.03}>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-2 border border-ct-line bg-white px-4 py-2.5 text-sm font-medium text-ct-ink hover:border-ct-ink transition-colors">
              <span className="h-1.5 w-1.5 rounded-full bg-ct-orange" />{step}
            </span>
            {i < LIFECYCLE.length - 1 && <ArrowRight size={14} className="text-ct-gray3" />}
          </div>
        </Reveal>
      ))}
    </div>

    <Reveal delay={0.1}>
      <div className="mt-8 flex flex-wrap gap-3">
        {["DELAYED", "HELD", "EXCEPTION", "CANCELLED"].map((e) => (
          <span key={e} className="font-mono text-[11px] tracking-[0.15em] border border-status-exception/30 text-status-exception px-3 py-1.5 bg-red-50/50">
            {e}
          </span>
        ))}
        <span className="text-sm text-ct-gray3 self-center">— exceptions can occur at any stage.</span>
      </div>
    </Reveal>
  </section>
);

/* ---------- Multi-Modal ---------- */
export const MultiModal = () => {
  const modes = [
    { icon: Truck, t: "Road", d: "Truck → Distribution Center → Customer" },
    { icon: Ship, t: "Ocean", d: "Factory → Port → Vessel → Port → Customs → Truck" },
    { icon: Plane, t: "Air", d: "Airport → Flight → Airport → Customs → Truck" },
    { icon: Train, t: "Rail", d: "Terminal → Rail → Terminal → Truck" },
  ];
  return (
    <section className="bg-ct-ink text-white">
      <div className="max-w-[1400px] mx-auto px-6 md:px-10 py-28 md:py-36">
        <div className="flex items-center gap-3 mb-6">
          <span className="font-mono text-[11px] tracking-[0.25em] text-ct-orange">04</span>
          <span className="h-px w-8 bg-white/20" />
          <span className="font-mono text-[11px] tracking-[0.25em] uppercase text-white/50">Multi-Modal</span>
        </div>
        <Reveal>
          <h2 className="font-display text-4xl sm:text-5xl md:text-6xl tracking-tighter leading-[0.95] max-w-3xl">
            One shipment. Multiple modes. <span className="text-ct-orange">One source of truth.</span>
          </h2>
        </Reveal>

        <div className="grid md:grid-cols-4 gap-px bg-white/10 border border-white/10 mt-14">
          {modes.map((m, i) => (
            <Reveal key={i} delay={i * 0.06}>
              <div className="bg-ct-ink p-7 h-full hover:bg-white/[0.04] transition-colors">
                <m.icon className="text-ct-orange mb-6" strokeWidth={1.5} size={26} />
                <h3 className="font-display text-xl tracking-tight mb-2">{m.t}</h3>
                <p className="font-mono text-[11px] tracking-wide text-white/50 leading-relaxed">{m.d}</p>
              </div>
            </Reveal>
          ))}
        </div>

        <Reveal delay={0.15}>
          <div className="mt-4 border border-white/10 p-6 flex flex-wrap items-center gap-3">
            <span className="font-mono text-[11px] tracking-[0.2em] uppercase text-ct-orange mr-2">Multimodal</span>
            {["Truck", "Warehouse", "Port", "Ocean", "Port", "Rail", "DC", "Last Mile"].map((s, i, a) => (
              <span key={i} className="flex items-center gap-3">
                <span className="text-sm text-white/80">{s}</span>
                {i < a.length - 1 && <ArrowRight size={13} className="text-white/30" />}
              </span>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
};

/* ---------- Event Normalization ---------- */
export const Normalization = () => (
  <section className="max-w-[1400px] mx-auto px-6 md:px-10 py-28 md:py-36">
    <SectionTag n="05">Event Normalization</SectionTag>
    <div className="grid md:grid-cols-2 gap-14 items-center">
      <div>
        <Reveal>
          <h2 className="font-display text-4xl sm:text-5xl tracking-tighter leading-[0.95] text-ct-ink mb-6">
            Different carriers. One language.
          </h2>
          <p className="text-ct-gray2 leading-relaxed max-w-md">
            Every carrier speaks differently. We translate inconsistent events into a single, predictable shipment lifecycle — so customers never need to learn carrier terminology.
          </p>
        </Reveal>
      </div>
      <Reveal delay={0.1}>
        <div className="border border-ct-line bg-ct-bg2 p-8">
          <div className="space-y-3">
            {[["Carrier A", "Shipment Picked"], ["Carrier B", "Collected"], ["Carrier C", "Pickup Complete"]].map(([c, e]) => (
              <div key={c} className="flex items-center justify-between bg-white border border-ct-line px-4 py-3">
                <span className="font-mono text-[11px] tracking-wide text-ct-gray3">{c}</span>
                <span className="font-mono text-sm text-ct-gray2">"{e}"</span>
              </div>
            ))}
          </div>
          <div className="flex justify-center my-4">
            <ArrowRight className="rotate-90 text-ct-orange" size={22} />
          </div>
          <div className="bg-ct-orange text-white px-5 py-4 flex items-center justify-between">
            <span className="font-mono text-[11px] tracking-[0.2em] uppercase text-white/70">Normalized</span>
            <span className="font-display text-2xl tracking-tight font-extrabold">PICKED UP</span>
          </div>
        </div>
      </Reveal>
    </div>
  </section>
);

/* ---------- Exceptions ---------- */
export const Exceptions = () => (
  <section id="exceptions" className="bg-ct-bg2 border-y border-ct-line">
    <div className="max-w-[1400px] mx-auto px-6 md:px-10 py-28 md:py-36">
      <SectionTag n="06">Exception Intelligence</SectionTag>
      <div className="grid md:grid-cols-12 gap-10 items-end mb-14">
        <div className="md:col-span-7">
          <Reveal>
            <h2 className="font-display text-4xl sm:text-5xl md:text-6xl tracking-tighter leading-[0.95] text-ct-ink">
              From "what happened?"
              <br /><span className="text-ct-orange">to "what do I do next?"</span>
            </h2>
          </Reveal>
        </div>
        <div className="md:col-span-5">
          <Reveal delay={0.1}>
            <p className="text-ct-gray2 leading-relaxed">
              We don't just flag a delay. We surface the reason, the location, the ETA impact and the recommended action — so operations teams respond before it becomes a customer problem.
            </p>
          </Reveal>
        </div>
      </div>

      <Reveal delay={0.15}>
        <div className="border border-ct-line bg-white">
          <div className="bg-red-50/60 border-b border-status-exception/20 px-6 py-4 flex items-center gap-3">
            <TriangleAlert className="text-status-exception" size={20} />
            <span className="font-display text-lg tracking-tight text-ct-ink">Shipment Delayed</span>
            <span className="ml-auto font-mono text-[11px] tracking-wide text-status-exception">CT-10188</span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-ct-line">
            {[
              ["Reason", "Customs Clearance Delay"],
              ["Location", "Rotterdam Port"],
              ["Impact", "ETA +2 days"],
              ["Action", "Customs docs required"],
            ].map(([k, v]) => (
              <div key={k} className="p-6">
                <div className="font-mono text-[11px] tracking-[0.2em] uppercase text-ct-gray3 mb-2">{k}</div>
                <div className="text-sm font-medium text-ct-ink leading-snug">{v}</div>
              </div>
            ))}
          </div>
        </div>
      </Reveal>
    </div>
  </section>
);

/* ---------- Orchestration ---------- */
export const Orchestration = () => (
  <section className="max-w-[1400px] mx-auto px-6 md:px-10 py-28 md:py-36">
    <SectionTag n="07">Orchestration</SectionTag>
    <div className="grid md:grid-cols-2 gap-14 items-center">
      <div>
        <Reveal>
          <h2 className="font-display text-4xl sm:text-5xl tracking-tighter leading-[0.95] text-ct-ink mb-6">
            Track less. Automate more.
          </h2>
          <p className="text-ct-gray2 leading-relaxed max-w-md mb-8">
            Turn shipment events into rules and automated actions. Reduce the operational cost of visibility through intelligent orchestration — instead of manually monitoring thousands of shipments.
          </p>
          <div className="grid grid-cols-2 gap-y-3 gap-x-6 max-w-md">
            {["Reduce manual tracking", "Fewer support tickets", "Detect delays earlier", "Automate notifications", "Less portal switching", "Lower overhead"].map((b) => (
              <div key={b} className="flex items-center gap-2 text-sm text-ct-gray2">
                <Check size={15} className="text-ct-orange shrink-0" />{b}
              </div>
            ))}
          </div>
        </Reveal>
      </div>
      <Reveal delay={0.1}>
        <div className="border border-ct-line bg-ct-ink text-white p-8 font-mono text-sm">
          <div className="text-white/40 text-[11px] tracking-[0.2em] uppercase mb-5">Rule Builder</div>
          {[
            ["IF", "Shipment is delayed", "#FF9500"],
            ["AND", "ETA impact > 24 hours", "#FF9500"],
            ["THEN", "Create exception", "#FF4500"],
            ["AND", "Notify operations team", "#FF4500"],
            ["AND", "Notify customer", "#FF4500"],
            ["AND", "Trigger workflow", "#FF4500"],
          ].map(([kw, txt, c], i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -12 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className="flex items-center gap-4 py-2 border-b border-white/10 last:border-0"
            >
              <span className="w-12 font-semibold" style={{ color: c }}>{kw}</span>
              <span className="text-white/80">{txt}</span>
            </motion.div>
          ))}
        </div>
      </Reveal>
    </div>
  </section>
);

/* ---------- Customer Experience ---------- */
export const CustomerExperience = () => (
  <section className="bg-ct-bg2 border-y border-ct-line">
    <div className="max-w-[1400px] mx-auto px-6 md:px-10 py-28 md:py-36">
      <SectionTag n="08">Customer Experience</SectionTag>
      <div className="grid md:grid-cols-2 gap-14">
        <Reveal>
          <h2 className="font-display text-4xl sm:text-5xl tracking-tighter leading-[0.95] text-ct-ink mb-6">
            No more "where is my order?"
          </h2>
          <p className="text-ct-gray2 leading-relaxed max-w-md mb-8">
            Replace post-purchase silence with a transparent, notified journey across email, SMS, push, webhooks and a customer portal.
          </p>
          <div className="flex flex-wrap gap-2">
            {["Picked up", "Dispatched", "In transit", "Delayed", "Customs", "Out for delivery", "Delivered", "ETA changed"].map((n) => (
              <span key={n} className="text-xs border border-ct-line bg-white px-3 py-1.5 text-ct-gray2">{n}</span>
            ))}
          </div>
        </Reveal>
        <Reveal delay={0.1}>
          <div className="space-y-2.5">
            {["Order Confirmed", "Picked Up", "In Transit", "At Customs", "Customs Cleared", "Out for Delivery", "Delivered"].map((s, i, a) => (
              <div key={s} className="flex items-center gap-4">
                <div className={`h-8 w-8 grid place-items-center shrink-0 ${i === a.length - 1 ? "bg-status-delivered text-white" : "bg-white border border-ct-line text-ct-orange"}`}>
                  {i === a.length - 1 ? <Check size={16} /> : <span className="h-2 w-2 rounded-full bg-ct-orange" />}
                </div>
                <div className="flex-1 bg-white border border-ct-line px-4 py-3 text-sm font-medium text-ct-ink">{s}</div>
              </div>
            ))}
          </div>
        </Reveal>
      </div>
    </div>
  </section>
);

/* ---------- Architecture + Multi-Leg ---------- */
export const Architecture = () => (
  <section className="max-w-[1400px] mx-auto px-6 md:px-10 py-28 md:py-36">
    <SectionTag n="09">Multi-Carrier Architecture</SectionTag>
    <div className="mb-14 max-w-3xl">
      <Reveal>
        <h2 className="font-display text-4xl sm:text-5xl md:text-6xl tracking-tighter leading-[0.95] text-ct-ink">
          One integration. Every carrier. Unified visibility.
        </h2>
      </Reveal>
    </div>

    <Reveal delay={0.1}>
      <div className="border border-ct-line">
        <div className="p-6 border-b border-ct-line">
          <div className="font-mono text-[11px] tracking-[0.2em] uppercase text-ct-gray3 mb-4">Sources</div>
          <div className="flex flex-wrap gap-2">
            {["Carrier A", "Carrier B", "Carrier C", "Carrier D", "Tracking Provider", "ERP", "WMS", "TMS", "EDI", "Webhooks"].map((s) => (
              <span key={s} className="font-mono text-xs border border-ct-line px-3 py-1.5 text-ct-gray2 bg-ct-bg2">{s}</span>
            ))}
          </div>
        </div>
        <div className="bg-ct-ink text-white p-8 text-center">
          <div className="font-mono text-[11px] tracking-[0.25em] uppercase text-ct-orange mb-2">Control Tower Shipment</div>
          <div className="flex flex-wrap justify-center gap-2 mt-4">
            {["Normalized Events", "Shipment Journey", "ETA", "Exceptions", "Analytics", "Notifications", "Orchestration"].map((s) => (
              <span key={s} className="text-xs border border-white/20 px-3 py-1.5 text-white/80">{s}</span>
            ))}
          </div>
        </div>
        <div className="p-6 flex flex-wrap gap-2 justify-center bg-ct-bg2">
          {["Customer", "Operations", "Enterprise Systems"].map((s) => (
            <span key={s} className="font-mono text-xs border border-ct-line px-3 py-1.5 text-ct-ink bg-white">{s}</span>
          ))}
        </div>
      </div>
    </Reveal>

    <Reveal delay={0.15}>
      <div className="mt-16">
        <div className="font-mono text-[11px] tracking-[0.2em] uppercase text-ct-gray3 mb-6">Multi-Leg Shipment Model · Load → Legs → Events</div>
        <div className="border border-ct-line">
          <div className="bg-ct-ink text-white px-6 py-3 font-mono text-sm tracking-wide">LOAD · CT-10188</div>
          {[
            ["Leg 1", "Carrier A", "Truck", "delivered"],
            ["Leg 2", "Carrier B", "Ocean", "in_transit"],
            ["Leg 3", "Carrier C", "Rail", "held"],
            ["Leg 4", "Carrier D", "Last Mile", "exception"],
          ].map(([leg, carrier, mode, status]) => {
            const cmap = { delivered: "#34C759", in_transit: "#007AFF", held: "#FFCC00", exception: "#FF3B30" };
            return (
              <div key={leg} className="flex items-center gap-4 px-6 py-4 border-t border-ct-line hover:bg-ct-bg2 transition-colors">
                <span className="font-mono text-sm text-ct-ink w-16">{leg}</span>
                <span className="text-sm text-ct-gray2 w-28">{carrier}</span>
                <span className="text-sm font-medium text-ct-ink w-24">{mode}</span>
                <span className="ml-auto flex items-center gap-2 font-mono text-[11px] tracking-wide" style={{ color: cmap[status] }}>
                  <span className="h-2 w-2 rounded-full" style={{ background: cmap[status] }} />{status.replace("_", " ").toUpperCase()}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </Reveal>
  </section>
);

/* ---------- Business Impact + Who We Serve ---------- */
export const Impact = () => (
  <section className="bg-ct-ink text-white">
    <div className="max-w-[1400px] mx-auto px-6 md:px-10 py-28 md:py-36">
      <div className="flex items-center gap-3 mb-6">
        <span className="font-mono text-[11px] tracking-[0.25em] text-ct-orange">10</span>
        <span className="h-px w-8 bg-white/20" />
        <span className="font-mono text-[11px] tracking-[0.25em] uppercase text-white/50">Business Impact</span>
      </div>
      <Reveal>
        <h2 className="font-display text-4xl sm:text-5xl md:text-6xl tracking-tighter leading-[0.95] max-w-3xl mb-14">
          Measurable operational outcomes.
        </h2>
      </Reveal>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-px bg-white/10 border border-white/10">
        {["Less Manual Work", "Faster Exception Response", "Better Customer Visibility", "Lower Operational Overhead", "Improved Shipment Intelligence", "Better Carrier Management"].map((t, i) => (
          <Reveal key={t} delay={i * 0.05}>
            <div className="bg-ct-ink p-8 h-full">
              <span className="font-mono text-[11px] text-ct-orange">0{i + 1}</span>
              <p className="font-display text-xl md:text-2xl tracking-tight mt-4">{t}</p>
            </div>
          </Reveal>
        ))}
      </div>

      <div className="mt-16">
        <div className="font-mono text-[11px] tracking-[0.2em] uppercase text-white/50 mb-6">Who We Serve</div>
        <div className="flex flex-wrap gap-2">
          {["E-commerce", "Retail", "Manufacturing", "Logistics", "3PL", "Freight Forwarders", "Distributors", "Enterprise Supply Chains"].map((w) => (
            <span key={w} className="border border-white/20 px-4 py-2 text-sm text-white/80 hover:bg-white/5 transition-colors">{w}</span>
          ))}
        </div>
      </div>
    </div>
  </section>
);

/* ---------- Final CTA ---------- */
export const FinalCTA = ({ onDemo }) => (
  <section className="max-w-[1400px] mx-auto px-6 md:px-10 py-28 md:py-36 text-center">
    <Reveal>
      <MonoLabel className="text-ct-orange">Tracking → Visibility → Intelligence → Orchestration</MonoLabel>
      <h2 className="font-display text-4xl sm:text-6xl md:text-7xl tracking-tighter leading-[0.92] text-ct-ink mt-6 max-w-4xl mx-auto">
        Stop tracking shipments across dozens of systems.
      </h2>
      <p className="text-ct-gray2 text-lg mt-6 max-w-xl mx-auto">
        Bring every shipment into one control tower.
      </p>
      <button onClick={onDemo} className="mt-10 bg-ct-orange text-white text-base font-medium px-8 py-4 hover:bg-ct-orangehover transition-colors inline-flex items-center gap-2" data-testid="final-cta-demo-btn">
        Request a Demo <ArrowRight size={18} />
      </button>
    </Reveal>
  </section>
);
