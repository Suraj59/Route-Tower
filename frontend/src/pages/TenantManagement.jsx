import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Building2, Loader2, Plus, Users as UsersIcon, Pencil, X, Save } from "lucide-react";
import { toast } from "sonner";
import { listTenants, createTenant, updateTenant } from "@/lib/adminApi";

const emptyProfile = { owner_name: "", owner_email: "", address_street: "", address_city: "", address_country: "" };

export default function TenantManagement() {
  const [tenants, setTenants] = useState([]);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [profile, setProfile] = useState(emptyProfile);
  const [saving, setSaving] = useState(false);

  const refresh = async () => {
    setLoading(true);
    try {
      setTenants(await listTenants());
    } catch {
      toast.error("Couldn't load tenants.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { refresh(); }, []);

  const submit = async (e) => {
    e.preventDefault();
    if (!name.trim()) { toast.error("Enter a tenant name."); return; }
    setCreating(true);
    try {
      await createTenant(name.trim());
      setName("");
      toast.success("Tenant created");
      refresh();
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Couldn't create tenant.");
    } finally {
      setCreating(false);
    }
  };

  const openEdit = (t) => {
    setEditingId(t.id);
    setProfile({
      owner_name: t.owner_name || "", owner_email: t.owner_email || "",
      address_street: t.address_street || "", address_city: t.address_city || "", address_country: t.address_country || "",
    });
  };

  const saveProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateTenant(editingId, profile);
      toast.success("Tenant profile updated");
      setEditingId(null);
      refresh();
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Couldn't update tenant.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-[900px] mx-auto px-6 md:px-10 py-10">
      <div className="flex items-center gap-2 mb-1">
        <Building2 size={18} className="text-ct-orange" />
        <span className="font-mono text-[11px] tracking-[0.2em] uppercase text-ct-orange">Super Admin</span>
      </div>
      <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
        <h1 className="font-display text-3xl md:text-4xl tracking-tighter text-ct-ink">Tenants</h1>
        <Link to="/app/admin/users" className="inline-flex items-center gap-2 border border-ct-line text-ct-ink text-sm px-4 py-2.5 hover:border-ct-ink transition-colors" data-testid="goto-user-management">
          <UsersIcon size={15} /> User Management
        </Link>
      </div>

      <motion.form
        onSubmit={submit}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="border border-ct-line bg-white p-6 flex flex-wrap items-end gap-3 mb-6"
        data-testid="create-tenant-form"
      >
        <div className="flex-1 min-w-[220px]">
          <label className="block font-mono text-[10px] tracking-wide uppercase text-ct-gray3 mb-1.5">Tenant name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Acme Logistics"
            className="w-full border border-ct-line px-3.5 py-2.5 text-sm focus:outline-none focus:border-ct-ink"
            data-testid="tenant-name-input"
          />
        </div>
        <button
          type="submit"
          disabled={creating}
          className="inline-flex items-center gap-2 bg-ct-ink text-white text-sm font-medium px-5 py-2.5 hover:bg-ct-orange transition-colors disabled:opacity-60"
          data-testid="create-tenant-submit"
        >
          {creating ? <Loader2 size={15} className="animate-spin" /> : <Plus size={15} />} Create tenant
        </button>
      </motion.form>

      <div className="border border-ct-line bg-white" data-testid="tenant-list">
        <div className="px-5 py-3 border-b border-ct-line font-mono text-[11px] tracking-[0.2em] uppercase text-ct-gray3">
          All Tenants
        </div>
        <div className="divide-y divide-ct-line">
          {loading && <div className="p-5 text-sm text-ct-gray2">Loading…</div>}
          {!loading && tenants.length === 0 && <div className="p-5 text-sm text-ct-gray2">No tenants yet.</div>}
          {tenants.map((t) => (
            <div key={t.id} data-testid={`tenant-row-${t.id}`}>
              <div className="flex items-center justify-between px-5 py-3.5">
                <div>
                  <span className="text-sm font-medium text-ct-ink">{t.name}</span>
                  <div className="font-mono text-[11px] text-ct-gray3">
                    {t.owner_name ? `Owner: ${t.owner_name}` : "No owner set"} · {[t.address_city, t.address_country].filter(Boolean).join(", ") || "No address set"}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-mono text-[11px] text-ct-gray3">{new Date(t.created_at).toLocaleDateString()}</span>
                  <button onClick={() => (editingId === t.id ? setEditingId(null) : openEdit(t))} className="text-ct-gray2 hover:text-ct-ink" data-testid={`tenant-edit-${t.id}`}>
                    {editingId === t.id ? <X size={15} /> : <Pencil size={15} />}
                  </button>
                </div>
              </div>
              {editingId === t.id && (
                <form onSubmit={saveProfile} className="grid sm:grid-cols-2 gap-4 px-5 pb-5" data-testid={`tenant-profile-form-${t.id}`}>
                  <div>
                    <label className="block font-mono text-[10px] tracking-wide uppercase text-ct-gray3 mb-1.5">Owner name</label>
                    <input value={profile.owner_name} onChange={(e) => setProfile({ ...profile, owner_name: e.target.value })} className="w-full border border-ct-line px-3.5 py-2.5 text-sm focus:outline-none focus:border-ct-ink" data-testid="tenant-owner-name-input" />
                  </div>
                  <div>
                    <label className="block font-mono text-[10px] tracking-wide uppercase text-ct-gray3 mb-1.5">Owner email</label>
                    <input value={profile.owner_email} onChange={(e) => setProfile({ ...profile, owner_email: e.target.value })} className="w-full border border-ct-line px-3.5 py-2.5 text-sm focus:outline-none focus:border-ct-ink" data-testid="tenant-owner-email-input" />
                  </div>
                  <div>
                    <label className="block font-mono text-[10px] tracking-wide uppercase text-ct-gray3 mb-1.5">Street address</label>
                    <input value={profile.address_street} onChange={(e) => setProfile({ ...profile, address_street: e.target.value })} className="w-full border border-ct-line px-3.5 py-2.5 text-sm focus:outline-none focus:border-ct-ink" data-testid="tenant-address-street-input" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block font-mono text-[10px] tracking-wide uppercase text-ct-gray3 mb-1.5">City</label>
                      <input value={profile.address_city} onChange={(e) => setProfile({ ...profile, address_city: e.target.value })} className="w-full border border-ct-line px-3.5 py-2.5 text-sm focus:outline-none focus:border-ct-ink" data-testid="tenant-address-city-input" />
                    </div>
                    <div>
                      <label className="block font-mono text-[10px] tracking-wide uppercase text-ct-gray3 mb-1.5">Country</label>
                      <input value={profile.address_country} onChange={(e) => setProfile({ ...profile, address_country: e.target.value })} className="w-full border border-ct-line px-3.5 py-2.5 text-sm focus:outline-none focus:border-ct-ink" data-testid="tenant-address-country-input" />
                    </div>
                  </div>
                  <button type="submit" disabled={saving} className="sm:col-span-2 inline-flex items-center justify-center gap-2 bg-ct-ink text-white text-sm font-medium py-3 hover:bg-ct-orange transition-colors disabled:opacity-60" data-testid="tenant-profile-submit">
                    {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />} Save profile
                  </button>
                </form>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
