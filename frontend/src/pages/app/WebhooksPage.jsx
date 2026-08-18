import { useEffect, useState } from "react";
import { Webhook as WebhookIcon, Plus, Loader2, Trash2, Pencil, X } from "lucide-react";
import { toast } from "sonner";
import { listWebhooks, createWebhook, updateWebhook, removeWebhook } from "@/lib/adminApi";
import { can } from "@/lib/auth";

const EVENTS = [
  { value: "shipment.created", label: "Shipment created" },
  { value: "shipment.status_changed", label: "Status changed" },
  { value: "shipment.delivered", label: "Delivered" },
  { value: "shipment.exception", label: "Exception raised" },
];

const emptyForm = { url: "", events: [], enabled: true };

export default function WebhooksPage() {
  const [webhooks, setWebhooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);

  const refresh = async () => {
    setLoading(true);
    try {
      setWebhooks(await listWebhooks());
    } catch {
      toast.error("Couldn't load webhooks.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { refresh(); }, []);

  const openCreate = () => { setEditingId(null); setForm(emptyForm); setFormOpen(true); };
  const openEdit = (w) => { setEditingId(w.id); setForm({ url: w.url, events: w.events, enabled: w.enabled }); setFormOpen(true); };

  const toggleEvent = (val) => setForm((f) => ({
    ...f,
    events: f.events.includes(val) ? f.events.filter((e) => e !== val) : [...f.events, val],
  }));

  const submit = async (e) => {
    e.preventDefault();
    if (!form.url.trim()) { toast.error("Webhook URL is required."); return; }
    if (form.events.length === 0) { toast.error("Pick at least one event."); return; }
    setSaving(true);
    try {
      if (editingId) await updateWebhook(editingId, form);
      else await createWebhook(form);
      toast.success(editingId ? "Webhook updated" : "Webhook added");
      setFormOpen(false);
      refresh();
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Couldn't save webhook.");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id) => {
    if (!window.confirm("Remove this webhook?")) return;
    try {
      await removeWebhook(id);
      toast.success("Webhook removed");
      refresh();
    } catch {
      toast.error("Couldn't remove webhook.");
    }
  };

  return (
    <div className="max-w-[1000px] mx-auto px-6 md:px-10 py-10">
      <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
        <div>
          <span className="font-mono text-[11px] tracking-[0.25em] uppercase text-ct-orange flex items-center gap-2"><WebhookIcon size={13} /> Webhooks</span>
          <h1 className="font-display text-3xl md:text-4xl tracking-tighter text-ct-ink mt-2">Webhooks</h1>
          <p className="text-sm text-ct-gray2 mt-1">Get a POST request whenever a shipment event happens.</p>
        </div>
        {can("edit") && (
          <button onClick={openCreate} className="inline-flex items-center gap-2 bg-ct-ink text-white text-sm px-4 py-2.5 hover:bg-ct-orange transition-colors" data-testid="webhook-add-btn">
            <Plus size={15} /> Add Webhook
          </button>
        )}
      </div>

      {formOpen && (
        <form onSubmit={submit} className="border border-ct-line bg-white p-6 space-y-4 mb-6 relative" data-testid="webhook-form">
          <button type="button" onClick={() => setFormOpen(false)} className="absolute right-4 top-4 text-ct-gray3 hover:text-ct-ink"><X size={18} /></button>
          <div>
            <label className="block font-mono text-[10px] tracking-wide uppercase text-ct-gray3 mb-1.5">Endpoint URL</label>
            <input value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} placeholder="https://example.com/webhooks/route-tower" className="w-full border border-ct-line px-3.5 py-2.5 text-sm focus:outline-none focus:border-ct-ink" data-testid="webhook-url-input" />
          </div>
          <div>
            <label className="block font-mono text-[10px] tracking-wide uppercase text-ct-gray3 mb-2">Events</label>
            <div className="grid sm:grid-cols-2 gap-2">
              {EVENTS.map((ev) => (
                <label key={ev.value} className="flex items-center gap-2 text-sm text-ct-ink border border-ct-line px-3 py-2 cursor-pointer">
                  <input type="checkbox" checked={form.events.includes(ev.value)} onChange={() => toggleEvent(ev.value)} className="accent-ct-orange" data-testid={`webhook-event-${ev.value}`} />
                  {ev.label}
                </label>
              ))}
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm text-ct-ink">
            <input type="checkbox" checked={form.enabled} onChange={(e) => setForm({ ...form, enabled: e.target.checked })} className="accent-ct-orange" /> Enabled
          </label>
          <button type="submit" disabled={saving} className="w-full inline-flex items-center justify-center gap-2 bg-ct-ink text-white text-sm font-medium py-3 hover:bg-ct-orange transition-colors disabled:opacity-60" data-testid="webhook-submit">
            {saving ? <Loader2 size={15} className="animate-spin" /> : <Plus size={15} />} {editingId ? "Save changes" : "Add webhook"}
          </button>
        </form>
      )}

      <div className="border border-ct-line bg-white" data-testid="webhook-list">
        <div className="px-5 py-3 border-b border-ct-line font-mono text-[11px] tracking-[0.2em] uppercase text-ct-gray3">All Webhooks</div>
        <div className="divide-y divide-ct-line">
          {loading && <div className="p-5 text-sm text-ct-gray2">Loading…</div>}
          {!loading && webhooks.length === 0 && <div className="p-5 text-sm text-ct-gray2">No webhooks yet.</div>}
          {webhooks.map((w) => (
            <div key={w.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5" data-testid={`webhook-row-${w.id}`}>
              <div>
                <div className="text-sm font-medium text-ct-ink break-all">{w.url}</div>
                <div className="font-mono text-[10px] text-ct-gray3 mt-1">{w.events.join(", ")}</div>
              </div>
              <div className="flex items-center gap-3">
                <span className={`h-2 w-2 rounded-full ${w.enabled ? "bg-status-delivered" : "bg-ct-gray3"}`} />
                {can("edit") && <button onClick={() => openEdit(w)} className="text-ct-gray2 hover:text-ct-ink" data-testid={`webhook-edit-${w.id}`}><Pencil size={14} /></button>}
                {can("delete") && <button onClick={() => remove(w.id)} className="text-status-exception hover:opacity-70" data-testid={`webhook-delete-${w.id}`}><Trash2 size={14} /></button>}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
