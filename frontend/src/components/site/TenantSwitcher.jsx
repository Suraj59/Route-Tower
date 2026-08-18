import { useEffect, useState } from "react";
import { ChevronDown, Building2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { getUser, isSuperAdmin, setSession } from "@/lib/auth";
import { listAccessibleTenants, switchTenant } from "@/lib/adminApi";

// Lets a user who has access to more than one tenant (or a superadmin) switch the
// active tenant context. Switching re-issues the JWT with the new active tenant + the
// role granted for it, then reloads so every tenant-scoped page refetches fresh data.
export default function TenantSwitcher() {
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [switching, setSwitching] = useState(false);
  const user = getUser();
  const superAdmin = isSuperAdmin();

  useEffect(() => {
    listAccessibleTenants()
      .then(setTenants)
      .catch(() => toast.error("Couldn't load tenants."))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return null;
  if (!superAdmin && tenants.length <= 1) return null;

  const options = superAdmin
    ? [{ tenant_id: null, tenant_name: "All Tenants", role: "superadmin" }, ...tenants]
    : tenants;
  const activeValue = user?.tenant_id || "__all__";

  const onChange = async (e) => {
    const value = e.target.value;
    const tenantId = value === "__all__" ? null : value;
    if (tenantId === (user?.tenant_id || null)) return;
    setSwitching(true);
    try {
      const data = await switchTenant(tenantId);
      setSession(data);
      toast.success(`Switched to ${data.user.tenant_name || "All Tenants"}`);
      window.location.reload();
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Couldn't switch tenant.");
      setSwitching(false);
    }
  };

  return (
    <div className="px-4 pb-3" data-testid="tenant-switcher">
      <label className="flex items-center gap-1.5 font-mono text-[10px] tracking-[0.15em] uppercase text-ct-gray3 mb-1.5">
        <Building2 size={12} /> Tenant
      </label>
      <div className="relative">
        <select
          value={activeValue}
          onChange={onChange}
          disabled={switching}
          className="w-full appearance-none border border-ct-line bg-white px-3 py-2 pr-8 text-sm text-ct-ink focus:outline-none focus:border-ct-ink disabled:opacity-60"
          data-testid="tenant-switcher-select"
        >
          {options.map((t) => (
            <option key={t.tenant_id || "__all__"} value={t.tenant_id || "__all__"}>
              {t.tenant_name}{t.role !== "superadmin" ? ` (${t.role})` : ""}
            </option>
          ))}
        </select>
        {switching ? (
          <Loader2 size={14} className="animate-spin absolute right-2.5 top-1/2 -translate-y-1/2 text-ct-gray3 pointer-events-none" />
        ) : (
          <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-ct-gray3 pointer-events-none" />
        )}
      </div>
    </div>
  );
}
