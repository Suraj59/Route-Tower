import { useState } from "react";
import { Link } from "react-router-dom";
import {
  ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis,
  AreaChart, Area, Tooltip, CartesianGrid,
} from "recharts";
import { motion } from "framer-motion";
import { ArrowUpRight, TrendingUp, Search } from "lucide-react";
import Header from "@/components/site/Header";
import DemoModal from "@/components/site/DemoModal";
import WorldMap from "@/components/site/WorldMap";
import { DASHBOARD, SHIPMENTS, STATUS } from "@/lib/data";

const Panel = ({ title, right, children, className = "", testid }) => (
  <div className={`border border-ct-line bg-white ${className}`} data-testid={testid}>
    <div className="flex items-center justify-between px-5 py-3 border-b border-ct-line">
      <span className="font-mono text-[11px] tracking-[0.2em] uppercase text-ct-gray3">{title}</span>
      {right}
    </div>
    <div className="p-5">{children}</div>
  </div>
);

export default function Dashboard() {
  const [demo, setDemo] = useState(false);
  const [filter, setFilter] = useState("all");
  const [q, setQ] = useState("");

  const filtered = SHIPMENTS.filter((s) =>
    (filter === "all" || s.status === filter) &&
    (q === "" || s.id.toLowerCase().includes(q.toLowerCase()) || s.destination.toLowerCase().includes(q.toLowerCase()))
  );

  return (
    <div className="bg-ct-bg2 min-h-screen">
      <Header onDemo={() => setDemo(true)} />
      <div className="max-w-[1400px] mx-auto px-6 md:px-10 pt-24 pb-20">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
            <div>
              <span className="font-mono text-[11px] tracking-[0.25em] uppercase text-ct-orange">Route Tower Dashboard · Demo</span>
              <h1 className="font-display text-4xl md:text-5xl tracking-tighter text-ct-ink mt-2">Global Shipment Overview</h1>
            </div>
            <div className="text-right">
              <div className="font-display text-5xl md:text-6xl font-extrabold tracking-tighter text-ct-ink" data-testid="active-count">
                {DASHBOARD.active.toLocaleString()}
              </div>
              <div className="font-mono text-[11px] tracking-[0.2em] uppercase text-ct-gray3">Active Shipments</div>
            </div>
          </div>
        </motion.div>

        {/* KPI strip */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-px bg-ct-line border border-ct-line mb-4">
          {DASHBOARD.breakdown.map((b) => (
            <div key={b.label} className="bg-white p-5" data-testid={`kpi-${b.label.toLowerCase().replace(/ /g, "-")}`}>
              <div className="flex items-center gap-2 mb-3">
                <span className="h-2 w-2 rounded-full" style={{ background: b.color }} />
                <span className="font-mono text-[10px] tracking-wide uppercase text-ct-gray3">{b.label}</span>
              </div>
              <div className="font-display text-2xl md:text-3xl tracking-tight text-ct-ink">{b.value.toLocaleString()}</div>
            </div>
          ))}
        </div>

        {/* Charts row */}
        <div className="grid md:grid-cols-12 gap-4 mb-4">
          <Panel title="Status Breakdown" testid="chart-status" className="md:col-span-4">
            <div className="relative">
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={DASHBOARD.breakdown} dataKey="value" cx="50%" cy="50%" innerRadius={62} outerRadius={92} paddingAngle={2} stroke="none" isAnimationActive={false}>
                    {DASHBOARD.breakdown.map((b, i) => <Cell key={i} fill={b.color} />)}
                  </Pie>
                  <Tooltip contentStyle={{ border: "1px solid #E5E5EA", borderRadius: 0, fontSize: 12, fontFamily: "JetBrains Mono" }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="font-display text-2xl font-extrabold text-ct-ink">12.4K</span>
                <span className="font-mono text-[10px] tracking-wide text-ct-gray3">TOTAL</span>
              </div>
            </div>
          </Panel>

          <Panel title="ETA Performance · On-Time %" testid="chart-eta" className="md:col-span-8" right={<span className="flex items-center gap-1 text-status-delivered text-xs font-mono"><TrendingUp size={13} />92% avg</span>}>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={DASHBOARD.etaPerf}>
                <defs>
                  <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#FF4500" stopOpacity={0.25} />
                    <stop offset="100%" stopColor="#FF4500" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#F0F0F2" vertical={false} />
                <XAxis dataKey="week" tick={{ fontSize: 11, fontFamily: "JetBrains Mono", fill: "#8E8E93" }} axisLine={false} tickLine={false} />
                <YAxis domain={[80, 100]} tick={{ fontSize: 11, fontFamily: "JetBrains Mono", fill: "#8E8E93" }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ border: "1px solid #E5E5EA", borderRadius: 0, fontSize: 12, fontFamily: "JetBrains Mono" }} />
                <Area type="monotone" dataKey="onTime" stroke="#FF4500" strokeWidth={2} fill="url(#g1)" />
              </AreaChart>
            </ResponsiveContainer>
          </Panel>
        </div>

        <div className="grid md:grid-cols-12 gap-4 mb-4">
          <Panel title="Shipments by Mode" testid="chart-mode" className="md:col-span-5">
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={DASHBOARD.byMode} layout="vertical" margin={{ left: 10 }}>
                <XAxis type="number" hide />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fontFamily: "JetBrains Mono", fill: "#4A4A52" }} axisLine={false} tickLine={false} width={80} />
                <Tooltip contentStyle={{ border: "1px solid #E5E5EA", borderRadius: 0, fontSize: 12, fontFamily: "JetBrains Mono" }} cursor={{ fill: "#F7F7F8" }} />
                <Bar dataKey="value" fill="#111111" barSize={16} />
              </BarChart>
            </ResponsiveContainer>
          </Panel>
          <Panel title="Shipments by Country" testid="chart-country" className="md:col-span-7">
            <div className="space-y-2.5">
              {DASHBOARD.byCountry.map((c) => {
                const pct = (c.value / DASHBOARD.byCountry[0].value) * 100;
                return (
                  <div key={c.country} className="flex items-center gap-4">
                    <span className="text-sm text-ct-ink w-32 shrink-0">{c.country}</span>
                    <div className="flex-1 bg-ct-bg3 h-2.5">
                      <motion.div className="h-full bg-ct-orange" initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.8 }} />
                    </div>
                    <span className="font-mono text-xs text-ct-gray2 w-14 text-right">{c.value.toLocaleString()}</span>
                  </div>
                );
              })}
            </div>
          </Panel>
        </div>

        {/* Map */}
        <Panel title="Active Routes" testid="dashboard-map" className="mb-4">
          <div className="bg-ct-bg2 -m-5">
            <WorldMap shipments={SHIPMENTS} activeId={null} onSelect={() => {}} />
          </div>
        </Panel>

        {/* Carrier Analytics */}
        <div className="border border-ct-line bg-white mb-4" data-testid="carrier-analytics">
          <div className="flex items-center justify-between px-5 py-3 border-b border-ct-line">
            <span className="font-mono text-[11px] tracking-[0.2em] uppercase text-ct-gray3">Carrier Performance · Ranked by On-Time</span>
            <span className="font-mono text-[10px] tracking-wide text-ct-gray3">On-Time % · Exceptions</span>
          </div>
          <div className="divide-y divide-ct-line">
            {[...DASHBOARD.byCarrier].sort((a, b) => b.onTime - a.onTime).map((c, i) => {
              const good = c.onTime >= 92;
              const bar = good ? "#34C759" : c.onTime >= 88 ? "#FF9500" : "#FF3B30";
              return (
                <div key={c.carrier} className="flex items-center gap-4 px-5 py-3.5 hover:bg-ct-bg2 transition-colors" data-testid={`carrier-row-${i}`}>
                  <span className="font-mono text-xs text-ct-gray3 w-6">{String(i + 1).padStart(2, "0")}</span>
                  <div className="w-40 shrink-0">
                    <div className="text-sm font-medium text-ct-ink">{c.carrier}</div>
                    <div className="font-mono text-[10px] text-ct-gray3">{c.mode} · {c.shipments.toLocaleString()} shpmts</div>
                  </div>
                  <div className="flex-1 flex items-center gap-3">
                    <div className="flex-1 bg-ct-bg3 h-2">
                      <motion.div className="h-full" style={{ background: bar }} initial={{ width: 0 }} whileInView={{ width: `${c.onTime}%` }} viewport={{ once: true }} transition={{ duration: 0.8 }} />
                    </div>
                    <span className="font-mono text-sm font-semibold w-12 text-right" style={{ color: bar }}>{c.onTime}%</span>
                  </div>
                  <span className="flex items-center gap-1.5 font-mono text-xs text-status-exception w-20 justify-end">
                    <span className="h-1.5 w-1.5 rounded-full bg-status-exception" />{c.exceptions}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Table with filters */}
        <div className="border border-ct-line bg-white" data-testid="shipment-table">
          <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3 border-b border-ct-line">
            <div className="flex flex-wrap gap-1.5">
              {["all", ...Object.keys(STATUS)].map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`font-mono text-[11px] tracking-wide uppercase px-3 py-1.5 border transition-colors ${filter === f ? "bg-ct-ink text-white border-ct-ink" : "border-ct-line text-ct-gray2 hover:border-ct-gray3"}`}
                  data-testid={`filter-${f}`}
                >
                  {f === "all" ? "All" : STATUS[f].label}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2 border border-ct-line px-3 py-1.5">
              <Search size={14} className="text-ct-gray3" />
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search ID / destination" className="text-sm focus:outline-none w-44" data-testid="table-search" />
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="font-mono text-[10px] tracking-[0.15em] uppercase text-ct-gray3">
                  {["Shipment", "Status", "Mode", "Origin", "Destination", "Carrier", "ETA", ""].map((h) => (
                    <th key={h} className="text-left font-normal px-5 py-3 border-b border-ct-line">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((s) => {
                  const st = STATUS[s.status];
                  return (
                    <tr key={s.id} className="border-b border-ct-line hover:bg-ct-bg2 transition-colors" data-testid={`row-${s.id}`}>
                      <td className="px-5 py-3.5 font-mono font-semibold text-ct-ink">{s.id}</td>
                      <td className="px-5 py-3.5">
                        <span className="inline-flex items-center gap-1.5 font-mono text-[11px]" style={{ color: st.color }}>
                          <span className="h-1.5 w-1.5 rounded-full" style={{ background: st.color }} />{st.label}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-ct-gray2">{s.mode}</td>
                      <td className="px-5 py-3.5 text-ct-gray2">{s.origin}</td>
                      <td className="px-5 py-3.5 text-ct-ink font-medium">{s.destination}</td>
                      <td className="px-5 py-3.5 text-ct-gray2">{s.carrier}</td>
                      <td className="px-5 py-3.5 font-mono text-xs text-ct-gray2">{s.eta}</td>
                      <td className="px-5 py-3.5">
                        <Link to={`/shipment/${s.id}`} className="text-ct-orange inline-flex items-center gap-1 hover:gap-2 transition-all" data-testid={`open-${s.id}`}>
                          <ArrowUpRight size={16} />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
                {filtered.length === 0 && (
                  <tr><td colSpan={8} className="px-5 py-10 text-center text-ct-gray3 text-sm">No shipments match your filters.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      <DemoModal open={demo} onClose={() => setDemo(false)} />
    </div>
  );
}
