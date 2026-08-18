import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Truck, MapPin, Warehouse as WarehouseIcon, Building2, Package, TriangleAlert } from "lucide-react";
import { toast } from "sonner";
import { listProviders, getMyTenant, listStores } from "@/lib/adminApi";
import { useShipments } from "@/lib/shipStore";
import { can } from "@/lib/auth";

const Card = ({ title, icon: Icon, right, children, testid }) => (
  <div className="border border-ct-line bg-white" data-testid={testid}>
    <div className="flex items-center justify-between px-5 py-3 border-b border-ct-line">
      <span className="font-mono text-[11px] tracking-[0.2em] uppercase text-ct-gray3 flex items-center gap-2">
        {Icon && <Icon size={13} className="text-ct-orange" />} {title}
      </span>
      {right}
    </div>
    <div className="p-5">{children}</div>
  </div>
);

export default function AppDashboard() {
  const shipments = useShipments();
  const [providers, setProviders] = useState([]);
  const [stores, setStores] = useState([]);
  const [tenant, setTenant] = useState(null);
  const [tenantError, setTenantError] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const results = await Promise.allSettled([listProviders(), listStores(), getMyTenant()]);
      if (results[0].status === "fulfilled") setProviders(results[0].value);
      else toast.error("Couldn't load providers.");
      if (results[1].status === "fulfilled") setStores(results[1].value);
      else toast.error("Couldn't load stores/warehouses.");
      if (results[2].status === "fulfilled") setTenant(results[2].value);
      else setTenantError(true);
      setLoading(false);
    })();
  }, []);

  const total = shipments.length;
  const exceptions = shipments.filter((s) => ["delayed", "held", "exception"].includes(s.status)).length;
  const active = shipments.filter((s) => s.status !== "delivered").length;

  return (
    <div className="max-w-[1200px] mx-auto px-6 md:px-10 py-10">
      <div className="mb-6">
        <span className="font-mono text-[11px] tracking-[0.25em] uppercase text-ct-orange">Route Tower</span>
        <h1 className="font-display text-3xl md:text-4xl tracking-tighter text-ct-ink mt-2">Dashboard</h1>
      </div>

      <div className="grid grid-cols-3 gap-px bg-ct-line border border-ct-line mb-4">
        <div className="bg-white p-5" data-testid="kpi-total">
          <div className="font-mono text-[10px] tracking-wide uppercase text-ct-gray3 mb-2">Total Shipments</div>
          <div className="font-display text-3xl tracking-tight text-ct-ink">{total}</div>
        </div>
        <div className="bg-white p-5" data-testid="kpi-active">
          <div className="font-mono text-[10px] tracking-wide uppercase text-ct-gray3 mb-2">Active</div>
          <div className="font-display text-3xl tracking-tight text-ct-ink">{active}</div>
        </div>
        <div className="bg-white p-5" data-testid="kpi-exceptions">
          <div className="font-mono text-[10px] tracking-wide uppercase text-ct-gray3 mb-2">Exceptions</div>
          <div className="font-display text-3xl tracking-tight text-status-exception">{exceptions}</div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4 mb-4">
        <Card title="Providers Enabled" icon={Truck} testid="dashboard-providers" right={<Link to="/app/providers" className="text-xs text-ct-orange">Manage →</Link>}>
          {!loading && providers.length === 0 && <p className="text-sm text-ct-gray2">No providers enabled yet.</p>}
          <div className="space-y-2.5">
            {providers.map((p) => (
              <div key={p.id} className="flex items-center justify-between gap-3" data-testid={`provider-row-${p.id}`}>
                <div className="flex items-center gap-2">
                  <span className={`h-1.5 w-1.5 rounded-full ${p.enabled ? "bg-status-delivered" : "bg-ct-gray3"}`} />
                  <span className="text-sm font-medium text-ct-ink">{p.name}</span>
                  <span className="font-mono text-[10px] text-ct-gray3">{p.type}</span>
                </div>
                <div className="font-mono text-xs text-ct-gray2">
                  {p.on_time_pct != null ? `${p.on_time_pct}% on-time` : "no data"} · {p.shipments_count} shpmts
                  {p.exceptions_count > 0 && <span className="text-status-exception ml-1.5">· {p.exceptions_count} exc</span>}
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card title="Organization Profile" icon={Building2} testid="dashboard-org">
          {tenantError && (
            <p className="text-sm text-ct-gray2">No tenant context on this account.</p>
          )}
          {tenant && (
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-ct-gray3">Organization</span><span className="font-medium text-ct-ink">{tenant.name}</span></div>
              <div className="flex justify-between"><span className="text-ct-gray3">Owner</span><span className="font-medium text-ct-ink">{tenant.owner_name || "—"}</span></div>
              <div className="flex justify-between"><span className="text-ct-gray3">Owner email</span><span className="font-medium text-ct-ink">{tenant.owner_email || "—"}</span></div>
              <div className="flex justify-between gap-4"><span className="text-ct-gray3 shrink-0">Default address</span>
                <span className="font-medium text-ct-ink text-right">
                  {[tenant.address_street, tenant.address_city, tenant.address_country].filter(Boolean).join(", ") || "—"}
                </span>
              </div>
              {can("manage_users") && (
                <Link to="/app/admin/tenants" className="inline-block text-xs text-ct-orange mt-1">Edit in Tenant Management →</Link>
              )}
            </div>
          )}
        </Card>
      </div>

      <Card title="Store / Warehouse Locations" icon={WarehouseIcon} testid="dashboard-stores" right={<Link to="/app/stores" className="text-xs text-ct-orange">Manage →</Link>}>
        {!loading && stores.length === 0 && <p className="text-sm text-ct-gray2">No store/warehouse locations yet — add one so providers know where to pick up shipments.</p>}
        <div className="grid sm:grid-cols-2 gap-3">
          {stores.map((s) => (
            <div key={s.id} className="border border-ct-line p-3.5" data-testid={`store-row-${s.id}`}>
              <div className="flex items-center gap-2 mb-1">
                <MapPin size={13} className="text-ct-orange" />
                <span className="text-sm font-medium text-ct-ink">{s.name}</span>
                <span className="font-mono text-[10px] uppercase text-ct-gray3">{s.type}</span>
              </div>
              <div className="text-xs text-ct-gray2">{[s.address, s.city, s.country].filter(Boolean).join(", ") || "No address set"}</div>
              <div className="font-mono text-[10px] text-ct-gray3 mt-1">ID: {s.id}</div>
            </div>
          ))}
        </div>
      </Card>

      {exceptions > 0 && (
        <div className="mt-4 flex items-center gap-2 text-sm text-status-exception" data-testid="dashboard-exception-hint">
          <TriangleAlert size={14} /> {exceptions} shipment{exceptions === 1 ? "" : "s"} need attention — <Link to="/app/shipments" className="underline">view shipments</Link>
        </div>
      )}
      {total === 0 && !loading && (
        <div className="mt-4 flex items-center gap-2 text-sm text-ct-gray2" data-testid="dashboard-empty-hint">
          <Package size={14} /> No shipments yet — <Link to="/app/shipments" className="underline text-ct-orange">create your first shipment</Link>
        </div>
      )}
    </div>
  );
}
