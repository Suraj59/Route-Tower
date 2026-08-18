import { useEffect, useState } from "react";
import { Truck, Plus, Loader2, Trash2, Pencil, X } from "lucide-react";
import { toast } from "sonner";
import { listProviders, createProvider, updateProvider, removeProvider } from "@/lib/adminApi";
import { can } from "@/lib/auth";

const TYPES = ["DHL", "FedEx", "UPS", "Maersk", "Custom"];

const emptyForm = { name: "", type: "DHL", enabled: true, account_id: "" };

export default function ProvidersPage() {
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);

  const refresh = async () => {
    setLoading(true);
    try {
      setProviders(await listProviders());
    } catch {
      toast.error("Couldn't load providers.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { refresh(); }, []);

  const openCreate = () => { setEditingId(null); setForm(emptyForm); setFormOpen(true); };
  const openEdit = (p) => {
    setEditingId(p.id);
    setForm({ name: p.name, type: p.type, enabled: p.enabled, account_id: p.config?.account_id || "" });
    setFormOpen(true);
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) { toast.error("Provider name is required."); return; }
    setSaving(true);
    const payload = { name: form.name.trim(), type: form.type, enabled: form.enabled, config: form.account_id ? { account_id: form.account_id } : {} };
    try {
      if (editingId) await updateProvider(editingId, payload);
      else await createProvider(payload);
      toast.success(editingId ? "Provider updated" : "Provider added");
      setFormOpen(false);
      refresh();
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Couldn't save provider.");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id) => {
    if (!window.confirm("Remove this provider?")) return;
    try {
      await removeProvider(id);
      toast.success("Provider removed");
      refresh();
    } catch {
      toast.error("Couldn't remove provider.");
    }
  };

  const toggleEnabled = async (p) => {
    try {
      await updateProvider(p.id, { enabled: !p.enabled });
      refresh();
    } catch {
      toast.error("Couldn't update provider.");
    }
  };

  return (
    <div className="max-w-[1000px] mx-auto px-6 md:px-10 py-10">
      <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
        <div>
          <span className="font-mono text-[11px] tracking-[0.25em] uppercase text-ct-orange flex items-center gap-2"><Truck size={13} /> Providers</span>
          <h1 className="font-display text-3xl md:text-4xl tracking-tighter text-ct-ink mt-2">Shipping Providers</h1>
        </div>
        {can("edit") && (
          <button onClick={openCreate} className="inline-flex items-center gap-2 bg-ct-ink text-white text-sm px-4 py-2.5 hover:bg-ct-orange transition-colors" data-testid="provider-add-btn">
            <Plus size={15} /> Add Provider
          </button>
        )}
      </div>

      {formOpen && (
        <form onSubmit={submit} className="border border-ct-line bg-white p-6 grid sm:grid-cols-2 gap-4 mb-6 relative" data-testid="provider-form">
          <button type="button" onClick={() => setFormOpen(false)} className="absolute right-4 top-4 text-ct-gray3 hover:text-ct-ink"><X size={18} /></button>
          <div>
            <label className="block font-mono text-[10px] tracking-wide uppercase text-ct-gray3 mb-1.5">Name</label>
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. DHL Express" className="w-full border border-ct-line px-3.5 py-2.5 text-sm focus:outline-none focus:border-ct-ink" data-testid="provider-name-input" />
          </div>
          <div>
            <label className="block font-mono text-[10px] tracking-wide uppercase text-ct-gray3 mb-1.5">Type</label>
            <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="w-full border border-ct-line px-3.5 py-2.5 text-sm focus:outline-none focus:border-ct-ink bg-white" data-testid="provider-type-select">
              {TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className="block font-mono text-[10px] tracking-wide uppercase text-ct-gray3 mb-1.5">Account / Reference ID</label>
            <input value={form.account_id} onChange={(e) => setForm({ ...form, account_id: e.target.value })} placeholder="optional" className="w-full border border-ct-line px-3.5 py-2.5 text-sm focus:outline-none focus:border-ct-ink" data-testid="provider-account-input" />
          </div>
          <label className="flex items-center gap-2 text-sm text-ct-ink">
            <input type="checkbox" checked={form.enabled} onChange={(e) => setForm({ ...form, enabled: e.target.checked })} className="accent-ct-orange" /> Enabled
          </label>
          <button type="submit" disabled={saving} className="sm:col-span-2 inline-flex items-center justify-center gap-2 bg-ct-ink text-white text-sm font-medium py-3 hover:bg-ct-orange transition-colors disabled:opacity-60" data-testid="provider-submit">
            {saving ? <Loader2 size={15} className="animate-spin" /> : <Plus size={15} />} {editingId ? "Save changes" : "Add provider"}
          </button>
        </form>
      )}

      <div className="border border-ct-line bg-white" data-testid="provider-list">
        <div className="px-5 py-3 border-b border-ct-line font-mono text-[11px] tracking-[0.2em] uppercase text-ct-gray3">All Providers</div>
        <div className="divide-y divide-ct-line">
          {loading && <div className="p-5 text-sm text-ct-gray2">Loading…</div>}
          {!loading && providers.length === 0 && <div className="p-5 text-sm text-ct-gray2">No providers yet.</div>}
          {providers.map((p) => (
            <div key={p.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5" data-testid={`provider-row-${p.id}`}>
              <div className="flex items-center gap-3">
                <button onClick={() => can("edit") && toggleEnabled(p)} className={`h-2 w-2 rounded-full ${p.enabled ? "bg-status-delivered" : "bg-ct-gray3"}`} title={p.enabled ? "Enabled" : "Disabled"} />
                <div>
                  <div className="text-sm font-medium text-ct-ink">{p.name}</div>
                  <div className="font-mono text-[11px] text-ct-gray3">{p.type}</div>
                </div>
              </div>
              <div className="font-mono text-xs text-ct-gray2">
                {p.on_time_pct != null ? `${p.on_time_pct}% on-time` : "no data"} · {p.shipments_count} shpmts
                {p.exceptions_count > 0 && <span className="text-status-exception ml-1.5">· {p.exceptions_count} exc</span>}
              </div>
              <div className="flex items-center gap-3">
                {can("edit") && <button onClick={() => openEdit(p)} className="text-ct-gray2 hover:text-ct-ink" data-testid={`provider-edit-${p.id}`}><Pencil size={14} /></button>}
                {can("delete") && <button onClick={() => remove(p.id)} className="text-status-exception hover:opacity-70" data-testid={`provider-delete-${p.id}`}><Trash2 size={14} /></button>}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
