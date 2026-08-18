import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { Radar, LayoutDashboard, Package, Sparkles, Truck, Webhook, Warehouse, Building2, Users, LogOut } from "lucide-react";
import { toast } from "sonner";
import { getUser, isSuperAdmin, logout } from "@/lib/auth";
import { resetShipments } from "@/lib/shipStore";
import TenantSwitcher from "@/components/site/TenantSwitcher";

const NAV = [
  { to: "/app", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/app/shipments", label: "Shipments", icon: Package },
  { to: "/app/post-purchase", label: "Post Purchase Experience", icon: Sparkles },
  { to: "/app/providers", label: "Provider", icon: Truck },
  { to: "/app/webhooks", label: "Webhook", icon: Webhook },
  { to: "/app/stores", label: "Store / Warehouse", icon: Warehouse },
];

const ADMIN_NAV = [
  { to: "/app/admin/tenants", label: "Create Tenant", icon: Building2 },
  { to: "/app/admin/users", label: "User Management", icon: Users },
];

export default function AppLayout() {
  const navigate = useNavigate();
  const user = getUser();
  const superAdmin = isSuperAdmin();

  const doLogout = () => {
    logout();
    resetShipments();
    toast.success("Logged out");
    navigate("/login");
  };

  const linkClass = ({ isActive }) =>
    `flex items-center gap-2.5 px-4 py-2.5 text-sm transition-colors ${
      isActive ? "bg-ct-ink text-white" : "text-ct-gray2 hover:bg-ct-bg3 hover:text-ct-ink"
    }`;

  return (
    <div className="min-h-screen bg-ct-bg2 flex" data-testid="app-shell">
      <aside className="w-64 shrink-0 bg-white border-r border-ct-line flex flex-col" data-testid="app-sidebar">
        <div className="h-16 flex items-center gap-2.5 px-5 border-b border-ct-line">
          <div className="h-8 w-8 bg-ct-ink text-ct-orange grid place-items-center">
            <Radar className="h-4.5 w-4.5" strokeWidth={1.8} size={18} />
          </div>
          <span className="font-display font-extrabold text-[15px] tracking-tight text-ct-ink">
            Route Tower<span className="text-ct-orange">.</span>
          </span>
        </div>

        <TenantSwitcher />

        <nav className="flex-1 py-4 space-y-0.5 border-t border-ct-line">
          {NAV.map((n) => (
            <NavLink key={n.to} to={n.to} end={n.end} className={linkClass} data-testid={`sidebar-${n.label.toLowerCase().replace(/[^a-z]+/g, "-")}`}>
              <n.icon size={16} /> {n.label}
            </NavLink>
          ))}

          {superAdmin && (
            <>
              <div className="px-5 pt-4 pb-1 font-mono text-[10px] tracking-[0.2em] uppercase text-ct-gray3">Super Admin</div>
              {ADMIN_NAV.map((n) => (
                <NavLink key={n.to} to={n.to} className={linkClass} data-testid={`sidebar-${n.label.toLowerCase().replace(/[^a-z]+/g, "-")}`}>
                  <n.icon size={16} /> {n.label}
                </NavLink>
              ))}
            </>
          )}
        </nav>

        <div className="p-4 border-t border-ct-line">
          <div className="text-xs text-ct-gray3 font-mono truncate mb-2" data-testid="app-current-user">{user?.email}</div>
          <button
            onClick={doLogout}
            className="w-full inline-flex items-center justify-center gap-1.5 border border-ct-line text-ct-ink text-sm px-3 py-2 hover:border-ct-ink transition-colors"
            data-testid="app-logout-btn"
          >
            <LogOut size={14} /> Logout
          </button>
        </div>
      </aside>

      <main className="flex-1 min-w-0">
        <Outlet />
      </main>
    </div>
  );
}
