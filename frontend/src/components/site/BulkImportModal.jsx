import { useState, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Upload, Loader2, Check, FileSpreadsheet, FileUp } from "lucide-react";
import { toast } from "sonner";
import { aiNormalizeCsv } from "@/lib/api";
import { addShipment } from "@/lib/shipStore";
import { STATUS } from "@/lib/data";

const SAMPLE = `ref,from,to,mode,status,eta
SO-8841,Osaka,Rotterdam,sea,in transit,Sep 12 2026
SO-8842,Delhi,Dubai,air,stuck at customs,Aug 30 2026
SO-8843,Chicago,Toronto,truck,on the road,Aug 22 2026`;

const TARGETS = [
  { key: "ref", label: "Reference / Tracking", syn: ["ref", "track", "id", "awb", "bol"] },
  { key: "origin", label: "Origin", syn: ["origin", "from", "source", "pickup", "shipper"] },
  { key: "destination", label: "Destination", syn: ["destination", "dest", "to", "delivery", "consignee"] },
  { key: "mode", label: "Mode", syn: ["mode", "transport", "how", "method", "carriermode"] },
  { key: "status", label: "Status", syn: ["status", "state", "stage", "milestone"] },
  { key: "carrier", label: "Carrier", syn: ["carrier", "company", "line", "scac"] },
  { key: "eta", label: "ETA", syn: ["eta", "arrival", "due", "delivery date", "date"] },
];

const parseCsv = (text) => {
  const lines = text.trim().split(/\r?\n/).filter(Boolean);
  if (!lines.length) return { headers: [], rows: [] };
  const split = (l) => l.split(",").map((c) => c.trim());
  return { headers: split(lines[0]), rows: lines.slice(1).map(split) };
};

const autoMap = (headers) => {
  const m = {};
  TARGETS.forEach((t) => {
    const idx = headers.findIndex((h) => t.syn.some((s) => h.toLowerCase().includes(s)));
    m[t.key] = idx;
  });
  return m;
};

export default function BulkImportModal({ open, onClose }) {
  const [step, setStep] = useState("input"); // input | map | result
  const [csv, setCsv] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [mapping, setMapping] = useState({});
  const fileRef = useRef(null);

  const parsed = useMemo(() => parseCsv(csv), [csv]);

  const reset = () => { setStep("input"); setCsv(""); setResult(null); setMapping({}); setLoading(false); };
  const close = () => { onClose(); setTimeout(reset, 250); };

  const onFile = (file) => {
    if (!file) return;
    const name = file.name.toLowerCase();
    const okType = file.type === "text/csv" || file.type === "text/plain" || file.type === "";
    if (!name.endsWith(".csv") && !okType) { toast.error("Please drop a .csv file"); return; }
    const reader = new FileReader();
    reader.onload = (e) => { setCsv(String(e.target.result || "")); toast.success(`Loaded ${file.name}`); };
    reader.readAsText(file);
  };

  const goMap = () => {
    if (!csv.trim()) { toast.error("Paste or drop CSV data first."); return; }
    if (!parsed.headers.length) { toast.error("Couldn't read any columns."); return; }
    setMapping(autoMap(parsed.headers));
    setStep("map");
  };

  const normalize = async () => {
    setLoading(true);
    try {
      // rebuild a clean canonical CSV from the mapping so AI gets well-labelled columns
      const cols = TARGETS.map((t) => t.key);
      const header = cols.join(",");
      const body = parsed.rows.map((r) =>
        cols.map((k) => { const i = mapping[k]; return i != null && i >= 0 ? (r[i] ?? "") : ""; }).join(",")
      ).join("\n");
      const ships = await aiNormalizeCsv(`${header}\n${body}`);
      if (!ships?.length) { toast.error("No shipments detected."); setLoading(false); return; }
      setResult(ships);
      setStep("result");
    } catch {
      toast.error("Couldn't normalize that data. Check the mapping.");
    } finally {
      setLoading(false);
    }
  };

  const importAll = async () => {
    try {
      await Promise.all(result.map((s) => addShipment({ ...s })));
      toast.success(`Imported ${result.length} shipments`);
      close();
    } catch {
      toast.error("Some shipments couldn't be imported.");
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-[100] flex items-center justify-center p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} data-testid="bulk-import-modal">
          <div className="absolute inset-0 bg-ct-ink/40 backdrop-blur-sm" onClick={close} />
          <motion.div className="relative bg-white w-full max-w-xl border border-ct-line" initial={{ scale: 0.96, y: 20, opacity: 0 }} animate={{ scale: 1, y: 0, opacity: 1 }} exit={{ scale: 0.96, y: 20, opacity: 0 }} transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}>
            <button onClick={close} className="absolute right-4 top-4 text-ct-gray3 hover:text-ct-ink z-10" data-testid="bulk-close"><X size={20} /></button>
            <div className="p-8">
              <span className="font-mono text-[11px] tracking-[0.25em] uppercase text-ct-orange flex items-center gap-2"><FileSpreadsheet size={13} /> Bulk Import · {step === "input" ? "Source" : step === "map" ? "Map Columns" : "Preview"}</span>
              <h3 className="font-display text-2xl md:text-3xl tracking-tight text-ct-ink mt-2 mb-5">
                {step === "input" ? "Drop a CSV or paste rows." : step === "map" ? "Map your columns." : "Review & import."}
              </h3>

              {step === "input" && (
                <>
                  <div
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => { e.preventDefault(); onFile(e.dataTransfer.files?.[0]); }}
                    onClick={() => fileRef.current?.click()}
                    className="border-2 border-dashed border-ct-line hover:border-ct-orange transition-colors p-6 text-center cursor-pointer mb-3"
                    data-testid="bulk-dropzone"
                  >
                    <FileUp className="mx-auto text-ct-orange mb-2" size={24} />
                    <p className="text-sm text-ct-ink font-medium">Drop a .csv file here or click to browse</p>
                    <p className="text-[11px] text-ct-gray3 mt-1">We parse it locally — nothing is uploaded until you import.</p>
                    <input ref={fileRef} type="file" accept=".csv,text/csv" className="hidden" onChange={(e) => onFile(e.target.files?.[0])} data-testid="bulk-file-input" />
                  </div>
                  <div className="font-mono text-[10px] tracking-wide text-ct-gray3 mb-2">OR PASTE</div>
                  <textarea value={csv} onChange={(e) => setCsv(e.target.value)} rows={5} placeholder="Paste rows with any headers…" className="w-full border border-ct-line px-3.5 py-3 text-sm font-mono focus:outline-none focus:border-ct-ink resize-none" data-testid="bulk-csv" />
                  <div className="flex items-center justify-between mt-2">
                    <button onClick={() => setCsv(SAMPLE)} className="text-[11px] text-ct-gray2 hover:text-ct-ink underline" data-testid="bulk-sample">Use sample data</button>
                    <span className="font-mono text-[10px] text-ct-gray3">Up to 15 rows</span>
                  </div>
                  <button onClick={goMap} className="mt-4 w-full bg-ct-ink text-white text-sm font-medium py-3 hover:bg-ct-orange transition-colors inline-flex items-center justify-center gap-2" data-testid="bulk-next">
                    Next: map columns
                  </button>
                </>
              )}

              {step === "map" && (
                <>
                  <div className="grid grid-cols-2 gap-3 mb-4" data-testid="bulk-mapping">
                    {TARGETS.map((t) => (
                      <div key={t.key}>
                        <label className="block font-mono text-[10px] tracking-wide uppercase text-ct-gray3 mb-1">{t.label}</label>
                        <select value={mapping[t.key] ?? -1} onChange={(e) => setMapping({ ...mapping, [t.key]: Number(e.target.value) })} className="w-full border border-ct-line px-2.5 py-2 text-sm text-ct-ink focus:outline-none focus:border-ct-ink" data-testid={`map-${t.key}`}>
                          <option value={-1}>— none —</option>
                          {parsed.headers.map((h, i) => <option key={i} value={i}>{h}</option>)}
                        </select>
                      </div>
                    ))}
                  </div>
                  <div className="border border-ct-line overflow-x-auto mb-4">
                    <table className="w-full text-[11px]">
                      <thead><tr className="bg-ct-bg2">{parsed.headers.map((h, i) => <th key={i} className="text-left font-mono px-2.5 py-2 text-ct-gray3 whitespace-nowrap">{h}</th>)}</tr></thead>
                      <tbody>
                        {parsed.rows.slice(0, 3).map((r, i) => <tr key={i} className="border-t border-ct-line">{r.map((c, j) => <td key={j} className="px-2.5 py-1.5 text-ct-gray2 whitespace-nowrap">{c}</td>)}</tr>)}
                      </tbody>
                    </table>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={normalize} disabled={loading} className="flex-1 bg-ct-orange text-white text-sm font-medium py-3 hover:bg-ct-orangehover transition-colors disabled:opacity-60 inline-flex items-center justify-center gap-2" data-testid="bulk-normalize">
                      {loading ? <><Loader2 size={16} className="animate-spin" /> Normalising…</> : <><Upload size={16} /> Normalise with AI</>}
                    </button>
                    <button onClick={() => setStep("input")} className="border border-ct-line text-ct-ink text-sm px-5 hover:border-ct-ink transition-colors" data-testid="bulk-back-input">Back</button>
                  </div>
                </>
              )}

              {step === "result" && result && (
                <div data-testid="bulk-result">
                  <div className="border border-ct-line max-h-64 overflow-y-auto divide-y divide-ct-line">
                    {result.map((s, i) => {
                      const st = STATUS[s.status] || STATUS.in_transit;
                      return (
                        <div key={i} className="flex items-center justify-between px-4 py-3">
                          <div>
                            <div className="text-sm font-medium text-ct-ink">{s.origin} → {s.destination}</div>
                            <div className="font-mono text-[10px] text-ct-gray3">{s.mode} · {s.carrier} · ETA {s.eta}</div>
                          </div>
                          <span className="flex items-center gap-1.5 font-mono text-[10px]" style={{ color: st.color }}>
                            <span className="h-1.5 w-1.5 rounded-full" style={{ background: st.color }} />{st.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                  <div className="flex gap-2 mt-4">
                    <button onClick={importAll} className="flex-1 bg-ct-orange text-white text-sm font-medium py-3 hover:bg-ct-orangehover transition-colors inline-flex items-center justify-center gap-2" data-testid="bulk-import-all"><Check size={16} /> Import {result.length} shipments</button>
                    <button onClick={() => setStep("map")} className="border border-ct-line text-ct-ink text-sm px-5 hover:border-ct-ink transition-colors" data-testid="bulk-back">Back</button>
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
