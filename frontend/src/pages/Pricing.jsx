import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Check, Minus, ArrowRight } from "lucide-react";
import Header from "@/components/site/Header";
import Footer from "@/components/site/Footer";
import DemoModal from "@/components/site/DemoModal";
import { SectionTag } from "@/components/site/Primitives";
import ROIEstimator from "@/components/site/ROIEstimator";

const TIERS = [
  {
    name: "Growth",
    tagline: "For scaling operations bringing carriers into one view.",
    price: "Custom",
    unit: "per shipment tier",
    highlight: false,
    cta: "Talk to Sales",
    features: ["Up to 25 carrier integrations", "Unified shipment journey", "Event normalization", "Real-time map & tracking", "Email + SMS notifications", "Standard support"],
  },
  {
    name: "Enterprise",
    tagline: "For teams running high-volume, multi-modal networks.",
    price: "Custom",
    unit: "volume-based",
    highlight: true,
    cta: "Request a Demo",
    features: ["Unlimited carrier integrations", "Multi-leg shipment model", "Exception intelligence", "Orchestration workflows", "All notification channels + webhooks", "Route Tower dashboard & analytics", "SSO & role-based access", "Priority support + CSM"],
  },
  {
    name: "Global",
    tagline: "For global supply chains needing deep customization.",
    price: "Custom",
    unit: "enterprise agreement",
    highlight: false,
    cta: "Talk to Sales",
    features: ["Everything in Enterprise", "Custom integrations & EDI", "Dedicated environment", "Advanced SLA & uptime", "Custom data residency", "Solution architect team"],
  },
];

const MATRIX = [
  ["Carrier integrations", "25", "Unlimited", "Unlimited"],
  ["Event normalization", true, true, true],
  ["Real-time shipment map", true, true, true],
  ["Multi-leg model", false, true, true],
  ["Exception intelligence", false, true, true],
  ["Orchestration workflows", false, true, true],
  ["Webhooks & API", "Read-only", "Full", "Full"],
  ["Notification channels", "Email, SMS", "All", "All"],
  ["SSO & RBAC", false, true, true],
  ["Custom integrations / EDI", false, false, true],
  ["Dedicated environment", false, false, true],
  ["Support", "Standard", "Priority + CSM", "Solution team"],
];

const Cell = ({ v }) => {
  if (v === true) return <Check size={16} className="text-status-delivered mx-auto" />;
  if (v === false) return <Minus size={16} className="text-ct-gray3 mx-auto" />;
  return <span className="text-sm text-ct-ink">{v}</span>;
};

export default function Pricing() {
  const [demo, setDemo] = useState(false);

  return (
    <div className="bg-white min-h-screen">
      <Header onDemo={() => setDemo(true)} />
      <div className="max-w-[1400px] mx-auto px-6 md:px-10 pt-28 pb-20">
        <SectionTag n="—">Pricing</SectionTag>
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="max-w-3xl">
          <h1 className="font-display text-5xl sm:text-6xl md:text-7xl tracking-tighter leading-[0.92] text-ct-ink">
            Pricing that scales with <span className="text-ct-orange">every shipment.</span>
          </h1>
          <p className="text-ct-gray2 text-lg mt-6">
            Volume-based plans built for enterprise supply chains. No per-seat games — you pay for the visibility you use.
          </p>
        </motion.div>

        {/* Tier cards */}
        <div className="grid md:grid-cols-3 gap-4 mt-14">
          {TIERS.map((t, i) => (
            <motion.div
              key={t.name}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08, duration: 0.6 }}
              className={`border p-8 flex flex-col ${t.highlight ? "border-ct-ink bg-ct-ink text-white" : "border-ct-line bg-white"}`}
              data-testid={`tier-${t.name.toLowerCase()}`}
            >
              {t.highlight && <span className="font-mono text-[10px] tracking-[0.2em] uppercase text-ct-orange mb-3">Most Popular</span>}
              <h3 className="font-display text-2xl tracking-tight">{t.name}</h3>
              <p className={`text-sm mt-2 mb-6 leading-relaxed ${t.highlight ? "text-white/60" : "text-ct-gray2"}`}>{t.tagline}</p>
              <div className="flex items-baseline gap-2 mb-1">
                <span className="font-display text-4xl font-extrabold tracking-tight">{t.price}</span>
              </div>
              <span className={`font-mono text-[11px] tracking-wide ${t.highlight ? "text-white/50" : "text-ct-gray3"}`}>{t.unit}</span>
              <button
                onClick={() => setDemo(true)}
                className={`mt-6 mb-8 text-sm font-medium py-3 inline-flex items-center justify-center gap-2 transition-colors ${t.highlight ? "bg-ct-orange text-white hover:bg-ct-orangehover" : "bg-ct-ink text-white hover:bg-ct-orange"}`}
                data-testid={`tier-cta-${t.name.toLowerCase()}`}
              >
                {t.cta} <ArrowRight size={15} />
              </button>
              <ul className="space-y-2.5 mt-auto">
                {t.features.map((f) => (
                  <li key={f} className={`flex items-start gap-2.5 text-sm ${t.highlight ? "text-white/80" : "text-ct-gray2"}`}>
                    <Check size={15} className="text-ct-orange shrink-0 mt-0.5" />{f}
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>

        {/* Comparison matrix */}
        <div className="mt-20">
          <div className="font-mono text-[11px] tracking-[0.2em] uppercase text-ct-gray3 mb-6">Compare Plans</div>
          <div className="border border-ct-line overflow-x-auto" data-testid="pricing-matrix">
            <table className="w-full text-sm min-w-[640px]">
              <thead>
                <tr className="border-b border-ct-line bg-ct-bg2">
                  <th className="text-left font-normal px-5 py-4 font-mono text-[11px] tracking-wide uppercase text-ct-gray3">Feature</th>
                  {["Growth", "Enterprise", "Global"].map((h) => (
                    <th key={h} className="px-5 py-4 font-display text-base text-ct-ink text-center">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {MATRIX.map((row, i) => (
                  <tr key={i} className="border-b border-ct-line last:border-0 hover:bg-ct-bg2 transition-colors">
                    <td className="px-5 py-3.5 text-ct-ink font-medium">{row[0]}</td>
                    <td className="px-5 py-3.5 text-center"><Cell v={row[1]} /></td>
                    <td className="px-5 py-3.5 text-center"><Cell v={row[2]} /></td>
                    <td className="px-5 py-3.5 text-center"><Cell v={row[3]} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* ROI Estimator */}
        <ROIEstimator />

        {/* CTA */}
        <div className="mt-20 border border-ct-line bg-ct-ink text-white p-10 md:p-14 flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <h2 className="font-display text-3xl md:text-4xl tracking-tight">Not sure which plan fits?</h2>
            <p className="text-white/60 mt-2">See Route Tower on your own shipments in a 30-minute walkthrough.</p>
          </div>
          <div className="flex gap-3 shrink-0">
            <button onClick={() => setDemo(true)} className="bg-ct-orange text-white text-sm font-medium px-6 py-3.5 hover:bg-ct-orangehover transition-colors inline-flex items-center gap-2" data-testid="pricing-demo-btn">
              Request a Demo <ArrowRight size={16} />
            </button>
            <Link to="/dashboard" className="border border-white/25 text-white text-sm font-medium px-6 py-3.5 hover:bg-white/10 transition-colors" data-testid="pricing-explore-btn">
              Explore Dashboard
            </Link>
          </div>
        </div>
      </div>
      <Footer onDemo={() => setDemo(true)} />
      <DemoModal open={demo} onClose={() => setDemo(false)} />
    </div>
  );
}
