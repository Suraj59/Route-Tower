import { useEffect, useState } from "react";
import { Warehouse, Plus, Loader2, Trash2, Pencil, X } from "lucide-react";
import { toast } from "sonner";
import { listStores, createStore, updateStore, removeStore } from "@/lib/adminApi";
import { can } from "@/lib/auth";

const emptyForm = { name: "", type: "warehouse", address: "", city: "", country: "", contact_name: "", contact_phone: "", contact_email: "", enabled: true };

export default function StoresPage() {
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);

  const refresh = async () => {
    setLoading(true);
    try {
      setStores(await listStores());
    } catch {
      toast.error("Couldn't load store/warehouse locations.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { refresh(); }, []);

  const openCreate = () => { setEditingId(null); setForm(emptyForm); setFormOpen(true); };
  const openEdit = (s) => {
    setEditingId(s.id);
    setForm({
      name: s.name, type: s.type, address: s.address || "", city: s.city || "", country: s.country || "",
      contact_name: s.contact_name || "", contact_phone: s.contact_phone || "", contact_email: s.contact_email || "", enabled: s.enabled,
    });
    setFormOpen(true);
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) { toast.error("Location name is required."); return; }
    setSaving(true);
    try {
      if (editingId) await updateStore(editingId, form);
      else await createStore(form);
      toast.success(editingId ? "Location updated" : "Location added");
      setFormOpen(false);
      refresh();
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Couldn't save location.");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id) => {
    if (!window.confirm("Remove this location?")) return;
    try {
      await removeStore(id);
      toast.success("Location removed");
      refresh();
    } catch {
      toast.error("Couldn't remove location.");
    }
  };

  return (
    <div className="max-w-[1000px] mx-auto px-6 md:px-10 py-10">
      <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
        <div>
          <span className="font-mono text-[11px] tracking-[0.25em] uppercase text-ct-orange flex items-center gap-2"><Warehouse size={13} /> Locations</span>
          <h1 className="font-display text-3xl md:text-4xl tracking-tighter text-ct-ink mt-2">Store / Warehouse</h1>
          <p className="text-sm text-ct-gray2 mt-1">Pickup, drop, and stop points providers use across a shipment's journey.</p>
        </div>
        {can("edit") && (
          <button onClick={openCreate} className="inline-flex items-center gap-2 bg-ct-ink text-white text-sm px-4 py-2.5 hover:bg-ct-orange transition-colors" data-testid="store-add-btn">
            <Plus size={15} /> Add Location
          </button>
        )}
      </div>

      {formOpen && (
        <form onSubmit={submit} className="border border-ct-line bg-white p-6 grid sm:grid-cols-2 gap-4 mb-6 relative" data-testid="store-form">
          <button type="button" onClick={() => setFormOpen(false)} className="absolute right-4 top-4 text-ct-gray3 hover:text-ct-ink"><X size={18} /></button>
          <div>
            <label className="block font-mono text-[10px] tracking-wide uppercase text-ct-gray3 mb-1.5">Name</label>
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. SF Fulfillment Center" className="w-full border border-ct-line px-3.5 py-2.5 text-sm focus:outline-none focus:border-ct-ink" data-testid="store-name-input" />
          </div>
          <div>
            <label className="block font-mono text-[10px] tracking-wide uppercase text-ct-gray3 mb-1.5">Type</label>
            <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="w-full border border-ct-line px-3.5 py-2.5 text-sm focus:outline-none focus:border-ct-ink bg-white" data-testid="store-type-select">
              <option value="warehouse">Warehouse</option>
              <option value="store">Store</option>
            </select>
          </div>
          <div>
            <label className="block font-mono text-[10px] tracking-wide uppercase text-ct-gray3 mb-1.5">Address</label>
            <input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className="w-full border border-ct-line px-3.5 py-2.5 text-sm focus:outline-none focus:border-ct-ink" data-testid="store-address-input" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-mono text-[10px] tracking-wide uppercase text-ct-gray3 mb-1.5">City</label>
              <input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} className="w-full border border-ct-line px-3.5 py-2.5 text-sm focus:outline-none focus:border-ct-ink" data-testid="store-city-input" />
            </div>
            <div>
              <label className="block font-mono text-[10px] tracking-wide uppercase text-ct-gray3 mb-1.5">Country</label>
              <input value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} className="w-full border border-ct-line px-3.5 py-2.5 text-sm focus:outline-none focus:border-ct-ink" data-testid="store-country-input" />
            </div>
          </div>
          <div>
            <label className="block font-mono text-[10px] tracking-wide uppercase text-ct-gray3 mb-1.5">Contact name</label>
            <input value={form.contact_name} onChange={(e) => setForm({ ...form, contact_name: e.target.value })} className="w-full border border-ct-line px-3.5 py-2.5 text-sm focus:outline-none focus:border-ct-ink" data-testid="store-contact-name-input" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-mono text-[10px] tracking-wide uppercase text-ct-gray3 mb-1.5">Contact phone</label>
              <input value={form.contact_phone} onChange={(e) => setForm({ ...form, contact_phone: e.target.value })} className="w-full border border-ct-line px-3.5 py-2.5 text-sm focus:outline-none focus:border-ct-ink" data-testid="store-contact-phone-input" />
            </div>
            <div>
              <label className="block font-mono text-[10px] tracking-wide uppercase text-ct-gray3 mb-1.5">Contact email</label>
              <input value={form.contact_email} onChange={(e) => setForm({ ...form, contact_email: e.target.value })} className="w-full border border-ct-line px-3.5 py-2.5 text-sm focus:outline-none focus:border-ct-ink" data-testid="store-contact-email-input" />
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm text-ct-ink">
            <input type="checkbox" checked={form.enabled} onChange={(e) => setForm({ ...form, enabled: e.target.checked })} className="accent-ct-orange" /> Enabled
          </label>
          <button type="submit" disabled={saving} className="sm:col-span-2 inline-flex items-center justify-center gap-2 bg-ct-ink text-white text-sm font-medium py-3 hover:bg-ct-orange transition-colors disabled:opacity-60" data-testid="store-submit">
            {saving ? <Loader2 size={15} className="animate-spin" /> : <Plus size={15} />} {editingId ? "Save changes" : "Add location"}
          </button>
        </form>
      )}

      <div className="border border-ct-line bg-white" data-testid="store-list">
        <div className="px-5 py-3 border-b border-ct-line font-mono text-[11px] tracking-[0.2em] uppercase text-ct-gray3">All Locations</div>
        <div className="divide-y divide-ct-line">
          {loading && <div className="p-5 text-sm text-ct-gray2">Loading…</div>}
          {!loading && stores.length === 0 && <div className="p-5 text-sm text-ct-gray2">No store/warehouse locations yet.</div>}
          {stores.map((s) => (
            <div key={s.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5" data-testid={`store-row-${s.id}`}>
              <div>
                <div className="text-sm font-medium text-ct-ink flex items-center gap-2">{s.name} <span className="font-mono text-[10px] uppercase text-ct-gray3">{s.type}</span></div>
                <div className="font-mono text-[11px] text-ct-gray3">{[s.address, s.city, s.country].filter(Boolean).join(", ") || "No address set"}</div>
                <div className="font-mono text-[10px] text-ct-gray3">ID: {s.id}</div>
              </div>
              <div className="flex items-center gap-3">
                {can("edit") && <button onClick={() => openEdit(s)} className="text-ct-gray2 hover:text-ct-ink" data-testid={`store-edit-${s.id}`}><Pencil size={14} /></button>}
                {can("delete") && <button onClick={() => remove(s.id)} className="text-status-exception hover:opacity-70" data-testid={`store-delete-${s.id}`}><Trash2 size={14} /></button>}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
