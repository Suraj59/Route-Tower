import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Calculator } from "lucide-react";

const fmt = (n) => "$" + Math.round(n).toLocaleString();

const Slider = ({ label, value, set, min, max, step, suffix = "", fmtVal }) => (
  <div data-testid={`roi-${label.toLowerCase().replace(/[^a-z]+/g, "-")}`}>
    <div className="flex items-center justify-between mb-2">
      <span className="text-sm text-ct-gray2">{label}</span>
      <span className="font-mono text-sm font-semibold text-ct-ink">{fmtVal ? fmtVal(value) : value.toLocaleString()}{suffix}</span>
    </div>
    <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => set(Number(e.target.value))} className="w-full accent-ct-orange" />
  </div>
);

export default function ROIEstimator() {
  const [shipments, setShipments] = useState(12000);
  const [ticketsPer100, setTicketsPer100] = useState(6);
  const [hoursPerWeek, setHoursPerWeek] = useState(30);
  const [hourlyCost, setHourlyCost] = useState(45);

  const r = useMemo(() => {
    const tickets = (shipments * ticketsPer100) / 100;
    const ticketSaved = tickets * 4 * 0.4; // $4/ticket, 40% deflection
    const laborSaved = hoursPerWeek * 4.33 * hourlyCost * 0.65; // 65% automation
    const monthly = ticketSaved + laborSaved;
    return { tickets, monthly, annual: monthly * 12, ticketSaved, laborSaved };
  }, [shipments, ticketsPer100, hoursPerWeek, hourlyCost]);

  return (
    <section className="mt-20" data-testid="roi-estimator">
      <div className="flex items-center gap-3 mb-6">
        <span className="font-mono text-[11px] tracking-[0.25em] text-ct-orange">ROI</span>
        <span className="h-px w-8 bg-ct-line" />
        <span className="font-mono text-[11px] tracking-[0.25em] uppercase text-ct-gray3">Savings Estimator</span>
      </div>
      <div className="grid md:grid-cols-12 border border-ct-line">
        <div className="md:col-span-7 p-8 md:p-10 border-b md:border-b-0 md:border-r border-ct-line">
          <h2 className="font-display text-3xl md:text-4xl tracking-tight text-ct-ink mb-2 flex items-center gap-3">
            <Calculator className="text-ct-orange" size={26} /> Estimate your savings
          </h2>
          <p className="text-sm text-ct-gray2 mb-8 max-w-md">Adjust the inputs to see estimated operational savings from automating shipment visibility and exception handling.</p>
          <div className="space-y-6">
            <Slider label="Monthly shipments" value={shipments} set={setShipments} min={500} max={200000} step={500} />
            <Slider label="Support tickets per 100 shipments" value={ticketsPer100} set={setTicketsPer100} min={0} max={20} step={1} />
            <Slider label="Hours/week spent tracking manually" value={hoursPerWeek} set={setHoursPerWeek} min={0} max={80} step={1} suffix=" hrs" />
            <Slider label="Fully-loaded hourly cost" value={hourlyCost} set={setHourlyCost} min={20} max={120} step={5} fmtVal={fmt} />
          </div>
        </div>
        <div className="md:col-span-5 bg-ct-ink text-white p-8 md:p-10 flex flex-col justify-center">
          <div className="font-mono text-[11px] tracking-[0.2em] uppercase text-white/50">Estimated savings</div>
          <motion.div key={Math.round(r.annual)} initial={{ opacity: 0.4, y: 6 }} animate={{ opacity: 1, y: 0 }} className="font-display text-5xl md:text-6xl font-extrabold tracking-tighter text-ct-orange mt-2" data-testid="roi-annual">
            {fmt(r.annual)}
          </motion.div>
          <div className="text-white/50 text-sm">per year</div>
          <div className="mt-8 space-y-3 border-t border-white/10 pt-6">
            <Row k="Monthly savings" v={fmt(r.monthly)} />
            <Row k="Support tickets / mo" v={Math.round(r.tickets).toLocaleString()} />
            <Row k="From ticket deflection" v={fmt(r.ticketSaved) + "/mo"} />
            <Row k="From reduced manual work" v={fmt(r.laborSaved) + "/mo"} />
          </div>
          <p className="mt-6 text-[11px] text-white/40 leading-relaxed">Illustrative estimate based on your inputs — not a guarantee of savings. Reduce the operational cost of shipment visibility through automation and intelligent orchestration.</p>
        </div>
      </div>
    </section>
  );
}

const Row = ({ k, v }) => (
  <div className="flex items-center justify-between">
    <span className="text-sm text-white/60">{k}</span>
    <span className="font-mono text-sm font-semibold text-white">{v}</span>
  </div>
);
