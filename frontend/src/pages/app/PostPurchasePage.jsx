import { useEffect, useState } from "react";
import { Sparkles, Loader2, Save } from "lucide-react";
import { toast } from "sonner";
import { getPostPurchase, updatePostPurchase } from "@/lib/adminApi";
import { can } from "@/lib/auth";

export default function PostPurchasePage() {
  const [form, setForm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const editable = can("edit");

  useEffect(() => {
    (async () => {
      try {
        setForm(await getPostPurchase());
      } catch {
        toast.error("Couldn't load post-purchase settings.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { tenant_id, updated_at, ...payload } = form;
      const updated = await updatePostPurchase(payload);
      setForm(updated);
      toast.success("Post purchase experience saved");
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Couldn't save changes.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-[800px] mx-auto px-6 md:px-10 py-10">
      <div className="mb-6">
        <span className="font-mono text-[11px] tracking-[0.25em] uppercase text-ct-orange flex items-center gap-2"><Sparkles size={13} /> Customer Experience</span>
        <h1 className="font-display text-3xl md:text-4xl tracking-tighter text-ct-ink mt-2">Post Purchase Experience</h1>
        <p className="text-sm text-ct-gray2 mt-1">Branding and messaging shown to customers on their tracking page after purchase.</p>
      </div>

      {loading && <div className="text-sm text-ct-gray2">Loading…</div>}

      {!loading && form && (
        <form onSubmit={submit} className="border border-ct-line bg-white p-6 space-y-5" data-testid="post-purchase-form">
          <div>
            <label className="block font-mono text-[10px] tracking-wide uppercase text-ct-gray3 mb-1.5">Logo URL</label>
            <input disabled={!editable} value={form.logo_url} onChange={(e) => setForm({ ...form, logo_url: e.target.value })} placeholder="https://…/logo.png" className="w-full border border-ct-line px-3.5 py-2.5 text-sm focus:outline-none focus:border-ct-ink disabled:bg-ct-bg3" data-testid="pp-logo-input" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-mono text-[10px] tracking-wide uppercase text-ct-gray3 mb-1.5">Primary color</label>
              <div className="flex items-center gap-2">
                <input disabled={!editable} type="color" value={form.primary_color} onChange={(e) => setForm({ ...form, primary_color: e.target.value })} className="h-10 w-12 border border-ct-line" data-testid="pp-primary-color" />
                <input disabled={!editable} value={form.primary_color} onChange={(e) => setForm({ ...form, primary_color: e.target.value })} className="flex-1 border border-ct-line px-3.5 py-2.5 text-sm focus:outline-none focus:border-ct-ink disabled:bg-ct-bg3" />
              </div>
            </div>
            <div>
              <label className="block font-mono text-[10px] tracking-wide uppercase text-ct-gray3 mb-1.5">Secondary color</label>
              <div className="flex items-center gap-2">
                <input disabled={!editable} type="color" value={form.secondary_color} onChange={(e) => setForm({ ...form, secondary_color: e.target.value })} className="h-10 w-12 border border-ct-line" data-testid="pp-secondary-color" />
                <input disabled={!editable} value={form.secondary_color} onChange={(e) => setForm({ ...form, secondary_color: e.target.value })} className="flex-1 border border-ct-line px-3.5 py-2.5 text-sm focus:outline-none focus:border-ct-ink disabled:bg-ct-bg3" />
              </div>
            </div>
          </div>
          <div>
            <label className="block font-mono text-[10px] tracking-wide uppercase text-ct-gray3 mb-1.5">Welcome message</label>
            <textarea disabled={!editable} value={form.welcome_message} onChange={(e) => setForm({ ...form, welcome_message: e.target.value })} rows={3} className="w-full border border-ct-line px-3.5 py-2.5 text-sm focus:outline-none focus:border-ct-ink disabled:bg-ct-bg3" data-testid="pp-welcome-input" />
          </div>
          <div>
            <label className="block font-mono text-[10px] tracking-wide uppercase text-ct-gray3 mb-1.5">Notification email template</label>
            <textarea disabled={!editable} value={form.notification_email_template} onChange={(e) => setForm({ ...form, notification_email_template: e.target.value })} rows={3} placeholder="Optional" className="w-full border border-ct-line px-3.5 py-2.5 text-sm focus:outline-none focus:border-ct-ink disabled:bg-ct-bg3" data-testid="pp-email-template-input" />
          </div>
          <div>
            <label className="block font-mono text-[10px] tracking-wide uppercase text-ct-gray3 mb-1.5">Notification SMS template</label>
            <textarea disabled={!editable} value={form.notification_sms_template} onChange={(e) => setForm({ ...form, notification_sms_template: e.target.value })} rows={2} placeholder="Optional" className="w-full border border-ct-line px-3.5 py-2.5 text-sm focus:outline-none focus:border-ct-ink disabled:bg-ct-bg3" data-testid="pp-sms-template-input" />
          </div>
          {editable && (
            <button type="submit" disabled={saving} className="inline-flex items-center gap-2 bg-ct-ink text-white text-sm font-medium px-5 py-2.5 hover:bg-ct-orange transition-colors disabled:opacity-60" data-testid="pp-submit">
              {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />} Save changes
            </button>
          )}
        </form>
      )}
    </div>
  );
}
