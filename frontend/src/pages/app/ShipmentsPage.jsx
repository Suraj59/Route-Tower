import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowUpRight, Search, Upload, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import BulkImportModal from "@/components/site/BulkImportModal";
import CreateShipmentModal from "@/components/site/CreateShipmentModal";
import Countdown from "@/components/site/Countdown";
import { STATUS } from "@/lib/data";
import { useShipments, removeShipment } from "@/lib/shipStore";
import { can } from "@/lib/auth";

export default function ShipmentsPage() {
  const shipments = useShipments();
  const [bulk, setBulk] = useState(false);
  const [create, setCreate] = useState(false);
  const [filter, setFilter] = useState("all");
  const [q, setQ] = useState("");

  const filtered = shipments.filter((s) =>
    (filter === "all" || s.status === filter) &&
    (q === "" || s.id.toLowerCase().includes(q.toLowerCase()) || s.destination.toLowerCase().includes(q.toLowerCase()))
  );

  const handleDelete = async (id) => {
    if (!window.confirm(`Delete shipment ${id}? This can't be undone.`)) return;
    try {
      await removeShipment(id);
      toast.success(`${id} deleted`);
    } catch {
      toast.error("Couldn't delete shipment.");
    }
  };

  return (
    <div className="max-w-[1200px] mx-auto px-6 md:px-10 py-10">
      <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
        <div>
          <span className="font-mono text-[11px] tracking-[0.25em] uppercase text-ct-orange">Route Tower</span>
          <h1 className="font-display text-3xl md:text-4xl tracking-tighter text-ct-ink mt-2">Shipments</h1>
        </div>
        <div className="flex items-center gap-3">
          {can("edit") && (
            <button onClick={() => setBulk(true)} className="inline-flex items-center gap-2 border border-ct-line text-ct-ink text-sm px-4 py-2.5 hover:border-ct-orange transition-colors" data-testid="bulk-open">
              <Upload size={15} /> Bulk Import
            </button>
          )}
          {can("edit") && (
            <button onClick={() => setCreate(true)} className="inline-flex items-center gap-2 bg-ct-ink text-white text-sm px-4 py-2.5 hover:bg-ct-orange transition-colors" data-testid="create-open">
              <Plus size={15} /> Create Shipment
            </button>
          )}
        </div>
      </div>

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
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search ID / destination" className="text-sm bg-transparent text-ct-ink focus:outline-none w-44" data-testid="table-search" />
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
                  <tr key={s.id} className="border-b border-ct-line hover:bg-ct-bg3 transition-colors" data-testid={`row-${s.id}`}>
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
                    <td className="px-5 py-3.5 font-mono text-xs text-ct-gray2"><Countdown eta={s.eta} status={s.status} compact /></td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        <Link to={`/app/shipments/${s.id}`} className="text-ct-orange inline-flex items-center gap-1 hover:gap-2 transition-all" data-testid={`open-${s.id}`}>
                          <ArrowUpRight size={16} />
                        </Link>
                        {can("delete") && (
                          <button onClick={() => handleDelete(s.id)} className="text-status-exception hover:opacity-70 transition-opacity" data-testid={`delete-${s.id}`}>
                            <Trash2 size={15} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr><td colSpan={8} className="px-5 py-10 text-center text-ct-gray2 text-sm">No shipments match your filters.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <BulkImportModal open={bulk} onClose={() => setBulk(false)} />
      <CreateShipmentModal open={create} onClose={() => setCreate(false)} onCreated={() => setCreate(false)} />
    </div>
  );
}
