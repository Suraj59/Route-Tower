import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import {
  ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis,
  AreaChart, Area, Tooltip, CartesianGrid,
} from "recharts";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowUpRight, TrendingUp, Search, Moon, Sun, Upload, Zap, Loader2, Bell, TriangleAlert } from "lucide-react";
import Header from "@/components/site/Header";
import DemoModal from "@/components/site/DemoModal";
import BulkImportModal from "@/components/site/BulkImportModal";
import WorldMap from "@/components/site/WorldMap";
import Countdown from "@/components/site/Countdown";
import { DASHBOARD, STATUS } from "@/lib/data";
import { useShipments, patchShipment } from "@/lib/shipStore";
import { aiAlerts } from "@/lib/api";
import { toast } from "sonner";

const Panel = ({ title, right, children, className = "", testid }) => (
  <div className={`border border-[var(--dr-border)] bg-[var(--dr-panel)] ${className}`} data-testid={testid}>
    <div className="flex items-center justify-between px-5 py-3 border-b border-[var(--dr-border)]">
      <span className="font-mono text-[11px] tracking-[0.2em] uppercase text-[var(--dr-sub)]">{title}</span>
      {right}
    </div>
    <div className="p-5">{children}</div>
  </div>
);

export default function Dashboard() {
  const [demo, setDemo] = useState(false);
  const [bulk, setBulk] = useState(false);
  const [filter, setFilter] = useState("all");
  const [q, setQ] = useState("");
  const [dark, setDark] = useState(() => localStorage.getItem("rt_dark") === "1");
  const [alerts, setAlerts] = useState(null);
  const [alertsLoading, setAlertsLoading] = useState(false);
  const [autoScan, setAutoScan] = useState(false);
  const [newIds, setNewIds] = useState(new Set());
  const [selected, setSelected] = useState(new Set());
  const seenRef = useRef(new Set());
  const shipments = useShipments();

  useEffect(() => { localStorage.setItem("rt_dark", dark ? "1" : "0"); }, [dark]);

  const runScan = async () => {
    setAlertsLoading(true);
    try {
      const a = await aiAlerts(shipments);
      const list = a || [];
      const fresh = list.filter((x) => !seenRef.current.has(x.id)).map((x) => x.id);
      list.forEach((x) => seenRef.current.add(x.id));
      setNewIds(new Set(fresh));
      setAlerts(list);
    } catch {
      setAlerts([]);
    } finally {
      setAlertsLoading(false);
    }
  };

  // Auto-refresh risk scan every 2 minutes when enabled
  useEffect(() => {
    if (!autoScan) return;
    runScan();
    const t = setInterval(runScan, 120000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoScan]);

  const toggleSel = (id) => setSelected((prev) => {
    const n = new Set(prev);
    n.has(id) ? n.delete(id) : n.add(id);
    return n;
  });

  const notifyCustomers = () => {
    const n = selected.size || (alerts ? alerts.length : 0);
    toast.success(`Notifications queued for ${n} customer${n === 1 ? "" : "s"}`);
  };

  const openExceptions = () => {
    const ids = selected.size ? [...selected] : (alerts || []).map((a) => a.id);
    ids.forEach((id) => patchShipment(id, { status: "exception" }));
    toast.success(`Opened ${ids.length} exception${ids.length === 1 ? "" : "s"}`);
    // remove handled alerts from the list so the queue reflects action taken
    setAlerts((prev) => (prev || []).filter((a) => !ids.includes(a.id)));
    setSelected(new Set());
  };

  const filtered = shipments.filter((s) =>
    (filter === "all" || s.status === filter) &&
    (q === "" || s.id.toLowerCase().includes(q.toLowerCase()) || s.destination.toLowerCase().includes(q.toLowerCase()))
  );

  return (
    <div className={`dash-root ${dark ? "dark" : ""} bg-[var(--dr-page)] min-h-screen`}>
      <Header onDemo={() => setDemo(true)} />
      <div className="max-w-[1400px] mx-auto px-6 md:px-10 pt-24 pb-20">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
            <div>
              <span className="font-mono text-[11px] tracking-[0.25em] uppercase text-ct-orange">Route Tower Dashboard · Demo</span>
              <h1 className="font-display text-4xl md:text-5xl tracking-tighter text-[var(--dr-text)] mt-2">Global Shipment Overview</h1>
            </div>
            <div className="flex items-end gap-3">
              <button onClick={() => setBulk(true)} className="inline-flex items-center gap-2 border border-[var(--dr-border)] text-[var(--dr-text)] text-sm px-4 py-2.5 hover:border-ct-orange transition-colors" data-testid="bulk-open">
                <Upload size={15} /> Bulk Import
              </button>
              <button onClick={() => setDark((d) => !d)} className="inline-flex items-center gap-2 border border-[var(--dr-border)] text-[var(--dr-text)] text-sm px-4 py-2.5 hover:border-ct-orange transition-colors" data-testid="dark-toggle">
                {dark ? <Sun size={15} /> : <Moon size={15} />} {dark ? "Light" : "Control Room"}
              </button>
              <div className="text-right">
                <div className="font-display text-5xl md:text-6xl font-extrabold tracking-tighter text-[var(--dr-text)]" data-testid="active-count">
                  {DASHBOARD.active.toLocaleString()}
                </div>
                <div className="font-mono text-[11px] tracking-[0.2em] uppercase text-[var(--dr-sub)]">Active Shipments</div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* KPI strip */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-px bg-[var(--dr-border)] border border-[var(--dr-border)] mb-4">
          {DASHBOARD.breakdown.map((b) => (
            <div key={b.label} className="bg-white p-5" data-testid={`kpi-${b.label.toLowerCase().replace(/ /g, "-")}`}>
              <div className="flex items-center gap-2 mb-3">
                <span className="h-2 w-2 rounded-full" style={{ background: b.color }} />
                <span className="font-mono text-[10px] tracking-wide uppercase text-[var(--dr-sub)]">{b.label}</span>
              </div>
              <div className="font-display text-2xl md:text-3xl tracking-tight text-[var(--dr-text)]">{b.value.toLocaleString()}</div>
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
                <span className="font-display text-2xl font-extrabold text-[var(--dr-text)]">12.4K</span>
                <span className="font-mono text-[10px] tracking-wide text-[var(--dr-sub)]">TOTAL</span>
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
                    <span className="text-sm text-[var(--dr-text)] w-32 shrink-0">{c.country}</span>
                    <div className="flex-1 bg-[var(--dr-track)] h-2.5">
                      <motion.div className="h-full bg-ct-orange" initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.8 }} />
                    </div>
                    <span className="font-mono text-xs text-[var(--dr-sub)] w-14 text-right">{c.value.toLocaleString()}</span>
                  </div>
                );
              })}
            </div>
          </Panel>
        </div>

        {/* Map */}
        <Panel title="Active Routes" testid="dashboard-map" className="mb-4">
          <div className="bg-[var(--dr-track)] -m-5">
            <WorldMap shipments={shipments} activeId={null} onSelect={() => {}} geoFill={dark ? "#1A1F27" : "#F0F0F2"} geoStroke={dark ? "#252B35" : "#E5E5EA"} />
          </div>
        </Panel>

        {/* Carrier Analytics */}
        <div className="border border-[var(--dr-border)] bg-[var(--dr-panel)] mb-4" data-testid="carrier-analytics">
          <div className="flex items-center justify-between px-5 py-3 border-b border-[var(--dr-border)]">
            <span className="font-mono text-[11px] tracking-[0.2em] uppercase text-[var(--dr-sub)]">Carrier Performance · Ranked by On-Time</span>
            <span className="font-mono text-[10px] tracking-wide text-[var(--dr-sub)]">On-Time % · Exceptions</span>
          </div>
          <div className="divide-y divide-[var(--dr-border)]">
            {[...DASHBOARD.byCarrier].sort((a, b) => b.onTime - a.onTime).map((c, i) => {
              const good = c.onTime >= 92;
              const bar = good ? "#34C759" : c.onTime >= 88 ? "#FF9500" : "#FF3B30";
              return (
                <div key={c.carrier} className="flex items-center gap-4 px-5 py-3.5 hover:bg-[var(--dr-track)] transition-colors" data-testid={`carrier-row-${i}`}>
                  <span className="font-mono text-xs text-[var(--dr-sub)] w-6">{String(i + 1).padStart(2, "0")}</span>
                  <div className="w-40 shrink-0">
                    <div className="text-sm font-medium text-[var(--dr-text)]">{c.carrier}</div>
                    <div className="font-mono text-[10px] text-[var(--dr-sub)]">{c.mode} · {c.shipments.toLocaleString()} shpmts</div>
                  </div>
                  <div className="flex-1 flex items-center gap-3">
                    <div className="flex-1 bg-[var(--dr-track)] h-2">
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

        {/* Smart Alerts */}
        <div className="border border-[var(--dr-border)] bg-[var(--dr-panel)] mb-4" data-testid="smart-alerts">
          <div className="flex flex-wrap items-center justify-between gap-2 px-5 py-3 border-b border-[var(--dr-border)]">
            <span className="font-mono text-[11px] tracking-[0.2em] uppercase text-[var(--dr-sub)] flex items-center gap-2"><Zap size={13} className="text-ct-orange" /> Smart Alerts · AI ETA-Risk Scan</span>
            <div className="flex items-center gap-2">
              <button onClick={() => setAutoScan((v) => !v)} className={`inline-flex items-center gap-1.5 text-xs font-medium px-3 py-2 border transition-colors ${autoScan ? "border-ct-orange text-ct-orange" : "border-[var(--dr-border)] text-[var(--dr-sub)] hover:border-ct-orange"}`} data-testid="auto-scan-toggle">
                <span className={`h-1.5 w-1.5 rounded-full ${autoScan ? "bg-ct-orange animate-pulse" : "bg-[var(--dr-sub)]"}`} />Auto {autoScan ? "On" : "Off"}
              </button>
              <button onClick={runScan} disabled={alertsLoading} className="inline-flex items-center gap-2 bg-ct-orange text-white text-xs font-medium px-3.5 py-2 hover:bg-ct-orangehover transition-colors disabled:opacity-60" data-testid="run-scan-btn">
                {alertsLoading ? <><Loader2 size={13} className="animate-spin" /> Scanning…</> : <><Zap size={13} /> Run AI risk scan</>}
              </button>
            </div>
          </div>
          <div className="p-5">
            {alerts === null && <p className="text-sm text-[var(--dr-sub)]">Run a scan (or enable Auto) to let AI flag shipments most likely to miss their ETA.</p>}
            {alerts && alerts.length === 0 && !alertsLoading && <p className="text-sm text-status-delivered">No at-risk shipments detected — all tracking on schedule.</p>}

            {alerts && alerts.length > 0 && (
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <span className="font-mono text-[11px] text-[var(--dr-sub)]">{selected.size ? `${selected.size} selected` : `${alerts.length} at risk`} · bulk actions:</span>
                <button onClick={notifyCustomers} className="inline-flex items-center gap-1.5 border border-[var(--dr-border)] text-[var(--dr-text)] text-xs px-3 py-1.5 hover:border-ct-orange transition-colors" data-testid="bulk-notify"><Bell size={12} /> Notify customers</button>
                <button onClick={openExceptions} className="inline-flex items-center gap-1.5 bg-status-exception/10 text-status-exception text-xs px-3 py-1.5 hover:bg-status-exception/20 transition-colors" data-testid="bulk-open-exceptions"><TriangleAlert size={12} /> Open exceptions</button>
              </div>
            )}

            <div className="space-y-2">
              <AnimatePresence>
                {alerts && alerts.map((a, i) => (
                  <motion.div key={a.id + i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                    className={`flex flex-wrap items-center gap-3 border p-3.5 ${selected.has(a.id) ? "border-ct-orange" : "border-[var(--dr-border)]"}`} data-testid={`alert-${a.id}`}>
                    <input type="checkbox" checked={selected.has(a.id)} onChange={() => toggleSel(a.id)} className="accent-ct-orange" data-testid={`alert-select-${a.id}`} />
                    <span className="font-mono text-xs font-semibold text-[var(--dr-text)] w-20 flex items-center gap-1.5">
                      {a.id}{newIds.has(a.id) && <span className="text-[8px] bg-ct-orange text-white px-1 py-0.5 leading-none" data-testid={`alert-new-${a.id}`}>NEW</span>}
                    </span>
                    <span className={`font-mono text-[10px] tracking-wide uppercase px-2 py-1 ${a.risk === "high" ? "bg-status-exception/10 text-status-exception" : "bg-status-delayed/10 text-status-delayed"}`}>{a.risk} risk</span>
                    <div className="flex items-center gap-2">
                      <div className="w-24 h-1.5 bg-[var(--dr-track)]"><div className="h-full bg-ct-orange" style={{ width: `${a.probability || 50}%` }} /></div>
                      <span className="font-mono text-xs text-[var(--dr-sub)]">{a.probability || 50}% miss</span>
                    </div>
                    <span className="text-sm text-[var(--dr-text)] flex-1 min-w-[160px]">{a.reason}</span>
                    <span className="text-xs text-ct-orange font-medium">→ {a.action}</span>
                    <Link to={`/shipment/${a.id}`} className="text-ct-orange" data-testid={`alert-open-${a.id}`}><ArrowUpRight size={16} /></Link>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Table with filters */}
        <div className="border border-[var(--dr-border)] bg-[var(--dr-panel)]" data-testid="shipment-table">
          <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3 border-b border-[var(--dr-border)]">
            <div className="flex flex-wrap gap-1.5">
              {["all", ...Object.keys(STATUS)].map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`font-mono text-[11px] tracking-wide uppercase px-3 py-1.5 border transition-colors ${filter === f ? "bg-ct-ink text-white border-ct-ink" : "border-[var(--dr-border)] text-[var(--dr-sub)] hover:border-ct-gray3"}`}
                  data-testid={`filter-${f}`}
                >
                  {f === "all" ? "All" : STATUS[f].label}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2 border border-[var(--dr-border)] px-3 py-1.5">
              <Search size={14} className="text-[var(--dr-sub)]" />
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search ID / destination" className="text-sm bg-transparent text-[var(--dr-text)] focus:outline-none w-44" data-testid="table-search" />
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="font-mono text-[10px] tracking-[0.15em] uppercase text-[var(--dr-sub)]">
                  {["Shipment", "Status", "Mode", "Origin", "Destination", "Carrier", "ETA", ""].map((h) => (
                    <th key={h} className="text-left font-normal px-5 py-3 border-b border-[var(--dr-border)]">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((s) => {
                  const st = STATUS[s.status];
                  return (
                    <tr key={s.id} className="border-b border-[var(--dr-border)] hover:bg-[var(--dr-track)] transition-colors" data-testid={`row-${s.id}`}>
                      <td className="px-5 py-3.5 font-mono font-semibold text-[var(--dr-text)]">{s.id}</td>
                      <td className="px-5 py-3.5">
                        <span className="inline-flex items-center gap-1.5 font-mono text-[11px]" style={{ color: st.color }}>
                          <span className="h-1.5 w-1.5 rounded-full" style={{ background: st.color }} />{st.label}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-[var(--dr-sub)]">{s.mode}</td>
                      <td className="px-5 py-3.5 text-[var(--dr-sub)]">{s.origin}</td>
                      <td className="px-5 py-3.5 text-[var(--dr-text)] font-medium">{s.destination}</td>
                      <td className="px-5 py-3.5 text-[var(--dr-sub)]">{s.carrier}</td>
                      <td className="px-5 py-3.5 font-mono text-xs text-[var(--dr-sub)]"><Countdown eta={s.eta} status={s.status} compact /></td>
                      <td className="px-5 py-3.5">
                        <Link to={`/shipment/${s.id}`} className="text-ct-orange inline-flex items-center gap-1 hover:gap-2 transition-all" data-testid={`open-${s.id}`}>
                          <ArrowUpRight size={16} />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
                {filtered.length === 0 && (
                  <tr><td colSpan={8} className="px-5 py-10 text-center text-[var(--dr-sub)] text-sm">No shipments match your filters.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      <DemoModal open={demo} onClose={() => setDemo(false)} />
      <BulkImportModal open={bulk} onClose={() => setBulk(false)} />
    </div>
  );
}
