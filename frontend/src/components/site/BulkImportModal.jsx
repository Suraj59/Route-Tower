import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Upload, Loader2, Check, FileSpreadsheet } from "lucide-react";
import { toast } from "sonner";
import { aiNormalizeCsv } from "@/lib/api";
import { addShipment } from "@/lib/shipStore";
import { STATUS } from "@/lib/data";

const SAMPLE = `ref,from,to,mode,status,eta
SO-8841,Osaka,Rotterdam,sea,in transit,Sep 12 2026
SO-8842,Delhi,Dubai,air,stuck at customs,Aug 30 2026
SO-8843,Chicago,Toronto,truck,on the road,Aug 22 2026`;

export default function BulkImportModal({ open, onClose }) {
  const [csv, setCsv] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const close = () => { onClose(); setTimeout(() => { setCsv(""); setResult(null); setLoading(false); }, 250); };

  const normalize = async () => {
    if (!csv.trim()) { toast.error("Paste some CSV data first."); return; }
    setLoading(true);
    try {
      const ships = await aiNormalizeCsv(csv);
      if (!ships?.length) { toast.error("No shipments detected."); }
      setResult(ships || []);
    } catch {
      toast.error("Couldn't normalize that data. Check the format.");
    } finally {
      setLoading(false);
    }
  };

  const importAll = () => {
    result.forEach((s) => addShipment({ ...s }));
    toast.success(`Imported ${result.length} shipments`);
    close();
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-[100] flex items-center justify-center p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} data-testid="bulk-import-modal">
          <div className="absolute inset-0 bg-ct-ink/40 backdrop-blur-sm" onClick={close} />
          <motion.div className="relative bg-white w-full max-w-xl border border-ct-line" initial={{ scale: 0.96, y: 20, opacity: 0 }} animate={{ scale: 1, y: 0, opacity: 1 }} exit={{ scale: 0.96, y: 20, opacity: 0 }} transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}>
            <button onClick={close} className="absolute right-4 top-4 text-ct-gray3 hover:text-ct-ink z-10" data-testid="bulk-close"><X size={20} /></button>
            <div className="p-8">
              <span className="font-mono text-[11px] tracking-[0.25em] uppercase text-ct-orange flex items-center gap-2"><FileSpreadsheet size={13} /> Bulk Import</span>
              <h3 className="font-display text-2xl md:text-3xl tracking-tight text-ct-ink mt-2 mb-5">Paste CSV — AI normalises it.</h3>

              {!result && (
                <>
                  <textarea value={csv} onChange={(e) => setCsv(e.target.value)} rows={7} placeholder="Paste rows with any headers — origin, destination, mode, status, ETA…" className="w-full border border-ct-line px-3.5 py-3 text-sm font-mono focus:outline-none focus:border-ct-ink resize-none" data-testid="bulk-csv" />
                  <div className="flex items-center justify-between mt-2">
                    <button onClick={() => setCsv(SAMPLE)} className="text-[11px] text-ct-gray2 hover:text-ct-ink underline" data-testid="bulk-sample">Use sample data</button>
                    <span className="font-mono text-[10px] text-ct-gray3">Up to 15 rows</span>
                  </div>
                  <button onClick={normalize} disabled={loading} className="mt-4 w-full bg-ct-orange text-white text-sm font-medium py-3 hover:bg-ct-orangehover transition-colors disabled:opacity-60 inline-flex items-center justify-center gap-2" data-testid="bulk-normalize">
                    {loading ? <><Loader2 size={16} className="animate-spin" /> Normalising…</> : <><Upload size={16} /> Normalise with AI</>}
                  </button>
                </>
              )}

              {result && (
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
                    <button onClick={() => setResult(null)} className="border border-ct-line text-ct-ink text-sm px-5 hover:border-ct-ink transition-colors" data-testid="bulk-back">Back</button>
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
