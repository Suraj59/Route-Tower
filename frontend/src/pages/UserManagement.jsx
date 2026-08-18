import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Users as UsersIcon, Loader2, Plus, Building2, X, Pencil, Check } from "lucide-react";
import { toast } from "sonner";
import { listTenants, listUsers, createUser, updateUserTenantAccess } from "@/lib/adminApi";

const ROLES = [
  { value: "admin", label: "Admin — view / edit / delete" },
  { value: "editor", label: "Editor — view / edit" },
  { value: "viewer", label: "Viewer — view only" },
];

const emptyGrant = (tenants) => ({ tenant_id: tenants[0]?.id || "", role: "viewer" });

function GrantRows({ grants, tenants, onChange, testPrefix }) {
  const update = (i, patch) => onChange(grants.map((g, idx) => (idx === i ? { ...g, ...patch } : g)));
  const remove = (i) => onChange(grants.filter((_, idx) => idx !== i));
  const add = () => onChange([...grants, emptyGrant(tenants)]);

  return (
    <div className="space-y-2">
      {grants.map((g, i) => (
        <div key={i} className="flex flex-wrap items-center gap-2" data-testid={`${testPrefix}-row-${i}`}>
          <select
            value={g.tenant_id}
            onChange={(e) => update(i, { tenant_id: e.target.value })}
            className="flex-1 min-w-[140px] border border-ct-line px-3 py-2 text-sm focus:outline-none focus:border-ct-ink bg-white"
            data-testid={`${testPrefix}-tenant-${i}`}
          >
            {tenants.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
          <select
            value={g.role}
            onChange={(e) => update(i, { role: e.target.value })}
            className="flex-1 min-w-[160px] border border-ct-line px-3 py-2 text-sm focus:outline-none focus:border-ct-ink bg-white"
            data-testid={`${testPrefix}-role-${i}`}
          >
            {ROLES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
          </select>
          <button
            type="button"
            onClick={() => remove(i)}
            disabled={grants.length <= 1}
            className="p-2 text-ct-gray3 hover:text-ct-ink disabled:opacity-30"
            data-testid={`${testPrefix}-remove-${i}`}
          >
            <X size={15} />
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={add}
        className="inline-flex items-center gap-1.5 font-mono text-[11px] tracking-wide uppercase text-ct-orange hover:underline"
        data-testid={`${testPrefix}-add`}
      >
        <Plus size={13} /> Add tenant access
      </button>
    </div>
  );
}

export default function UserManagement() {
  const [tenants, setTenants] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ email: "", password: "", grants: [] });
  const [editingId, setEditingId] = useState(null);
  const [editGrants, setEditGrants] = useState([]);
  const [savingAccess, setSavingAccess] = useState(false);

  const refresh = async () => {
    setLoading(true);
    try {
      const [t, u] = await Promise.all([listTenants(), listUsers()]);
      setTenants(t);
      setUsers(u);
      setForm((f) => ({ ...f, grants: f.grants.length ? f.grants : [emptyGrant(t)] }));
    } catch {
      toast.error("Couldn't load users/tenants.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { refresh(); }, []);

  const submit = async (e) => {
    e.preventDefault();
    if (!form.email || !form.password || form.grants.some((g) => !g.tenant_id)) {
      toast.error("Email, password and at least one tenant are required.");
      return;
    }
    if (form.password.length < 8) { toast.error("Password must be at least 8 characters."); return; }
    setCreating(true);
    try {
      await createUser({ email: form.email, password: form.password, tenant_access: form.grants });
      toast.success("User created");
      setForm({ email: "", password: "", grants: [emptyGrant(tenants)] });
      refresh();
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Couldn't create user.");
    } finally {
      setCreating(false);
    }
  };

  const startEditAccess = (u) => {
    setEditingId(u.id);
    setEditGrants(u.tenant_access?.length ? u.tenant_access.map((g) => ({ tenant_id: g.tenant_id, role: g.role })) : [emptyGrant(tenants)]);
  };

  const saveAccess = async (userId) => {
    if (editGrants.some((g) => !g.tenant_id)) { toast.error("Select a tenant for every row."); return; }
    setSavingAccess(true);
    try {
      await updateUserTenantAccess(userId, editGrants);
      toast.success("Tenant access updated");
      setEditingId(null);
      refresh();
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Couldn't update tenant access.");
    } finally {
      setSavingAccess(false);
    }
  };

  return (
    <div className="max-w-[900px] mx-auto px-6 md:px-10 py-10">
      <div className="flex items-center gap-2 mb-1">
        <UsersIcon size={18} className="text-ct-orange" />
        <span className="font-mono text-[11px] tracking-[0.2em] uppercase text-ct-orange">Super Admin</span>
      </div>
      <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
        <h1 className="font-display text-3xl md:text-4xl tracking-tighter text-ct-ink">User Management</h1>
        <Link to="/app/admin/tenants" className="inline-flex items-center gap-2 border border-ct-line text-ct-ink text-sm px-4 py-2.5 hover:border-ct-ink transition-colors" data-testid="goto-tenant-management">
          <Building2 size={15} /> Create Tenant
        </Link>
      </div>

      {!loading && tenants.length === 0 && (
        <div className="border border-ct-line bg-white p-5 text-sm text-ct-gray2 mb-6">
          No tenants yet — <Link to="/app/admin/tenants" className="text-ct-orange underline">create one first</Link> before assigning users.
        </div>
      )}

        <motion.form
          onSubmit={submit}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="border border-ct-line bg-white p-6 space-y-4 mb-6"
          data-testid="create-user-form"
        >
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-mono text-[10px] tracking-wide uppercase text-ct-gray3 mb-1.5">Email</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="user@tenant.com"
                className="w-full border border-ct-line px-3.5 py-2.5 text-sm focus:outline-none focus:border-ct-ink"
                data-testid="user-email-input"
              />
            </div>
            <div>
              <label className="block font-mono text-[10px] tracking-wide uppercase text-ct-gray3 mb-1.5">Password</label>
              <input
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder="Min. 8 characters"
                className="w-full border border-ct-line px-3.5 py-2.5 text-sm focus:outline-none focus:border-ct-ink"
                data-testid="user-password-input"
              />
            </div>
          </div>

          <div>
            <label className="block font-mono text-[10px] tracking-wide uppercase text-ct-gray3 mb-1.5">
              Tenant access — grant one role per tenant; add more rows for multi-tenant access
            </label>
            <GrantRows grants={form.grants} tenants={tenants} onChange={(grants) => setForm({ ...form, grants })} testPrefix="create-grant" />
          </div>

          <button
            type="submit"
            disabled={creating || tenants.length === 0}
            className="w-full inline-flex items-center justify-center gap-2 bg-ct-ink text-white text-sm font-medium py-3 hover:bg-ct-orange transition-colors disabled:opacity-60"
            data-testid="create-user-submit"
          >
            {creating ? <Loader2 size={15} className="animate-spin" /> : <Plus size={15} />} Create user
          </button>
        </motion.form>

        <div className="border border-ct-line bg-white" data-testid="user-list">
          <div className="px-5 py-3 border-b border-ct-line font-mono text-[11px] tracking-[0.2em] uppercase text-ct-gray3">
            All Users
          </div>
          <div className="divide-y divide-ct-line">
            {loading && <div className="p-5 text-sm text-ct-gray2">Loading…</div>}
            {!loading && users.length === 0 && <div className="p-5 text-sm text-ct-gray2">No tenant users yet.</div>}
            {users.map((u) => (
              <div key={u.id} className="px-5 py-3.5" data-testid={`user-row-${u.id}`}>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="text-sm font-medium text-ct-ink">{u.email}</div>
                  <button
                    onClick={() => (editingId === u.id ? setEditingId(null) : startEditAccess(u))}
                    className="inline-flex items-center gap-1.5 font-mono text-[10px] tracking-wide uppercase text-ct-gray3 hover:text-ct-ink"
                    data-testid={`user-edit-access-${u.id}`}
                  >
                    {editingId === u.id ? <X size={13} /> : <Pencil size={13} />} {editingId === u.id ? "Cancel" : "Manage access"}
                  </button>
                </div>

                {editingId === u.id ? (
                  <div className="mt-3 space-y-3">
                    <GrantRows grants={editGrants} tenants={tenants} onChange={setEditGrants} testPrefix={`edit-grant-${u.id}`} />
                    <button
                      onClick={() => saveAccess(u.id)}
                      disabled={savingAccess}
                      className="inline-flex items-center gap-1.5 bg-ct-ink text-white text-xs font-medium px-3 py-2 hover:bg-ct-orange transition-colors disabled:opacity-60"
                      data-testid={`user-save-access-${u.id}`}
                    >
                      {savingAccess ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />} Save access
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-1.5 mt-1.5">
                    {(u.tenant_access?.length ? u.tenant_access : [{ tenant_id: u.tenant_id, tenant_name: u.tenant_name, role: u.role }]).map((g, i) => (
                      <span key={i} className="font-mono text-[10px] tracking-wide uppercase px-2 py-1 bg-ct-bg3 text-ct-gray2" data-testid={`user-grant-chip-${u.id}-${i}`}>
                        {g.tenant_name || "—"} · {g.role}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
    </div>
  );
}
