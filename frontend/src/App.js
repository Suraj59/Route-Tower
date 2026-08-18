import { useEffect } from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route, useNavigate } from "react-router-dom";
import Lenis from "lenis";
import { Toaster } from "@/components/ui/sonner";
import Landing from "@/pages/Landing";
import Dashboard from "@/pages/Dashboard";
import ShipmentDetail from "@/pages/ShipmentDetail";
import Pricing from "@/pages/Pricing";
import TrackPage from "@/pages/TrackPage";
import Login from "@/pages/Login";
import TenantManagement from "@/pages/TenantManagement";
import UserManagement from "@/pages/UserManagement";
import AppLayout from "@/components/site/AppLayout";
import AppDashboard from "@/pages/app/AppDashboard";
import ShipmentsPage from "@/pages/app/ShipmentsPage";
import ProvidersPage from "@/pages/app/ProvidersPage";
import WebhooksPage from "@/pages/app/WebhooksPage";
import StoresPage from "@/pages/app/StoresPage";
import PostPurchasePage from "@/pages/app/PostPurchasePage";
import { RequireAuth, RequireSuperAdmin } from "@/components/site/ProtectedRoute";
import { setOnUnauthorized } from "@/lib/auth";

function AuthWatcher() {
  const navigate = useNavigate();
  useEffect(() => {
    setOnUnauthorized(() => navigate("/login"));
  }, [navigate]);
  return null;
}

function App() {
  useEffect(() => {
    const lenis = new Lenis({ duration: 1.1, smoothWheel: true });
    window.lenis = lenis;
    let raf;
    const loop = (t) => { lenis.raf(t); raf = requestAnimationFrame(loop); };
    raf = requestAnimationFrame(loop);
    return () => { cancelAnimationFrame(raf); lenis.destroy(); delete window.lenis; };
  }, []);

  return (
    <div className="App">
      <BrowserRouter>
        <AuthWatcher />
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          {/* public marketing/demo — showcases the platform without requiring an account */}
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/pricing" element={<Pricing />} />
          <Route path="/track/:id" element={<TrackPage />} />

          {/* authenticated app area — left sidebar shell */}
          <Route path="/app" element={<RequireAuth><AppLayout /></RequireAuth>}>
            <Route index element={<AppDashboard />} />
            <Route path="shipments" element={<ShipmentsPage />} />
            <Route path="shipments/:id" element={<ShipmentDetail />} />
            <Route path="post-purchase" element={<PostPurchasePage />} />
            <Route path="providers" element={<ProvidersPage />} />
            <Route path="webhooks" element={<WebhooksPage />} />
            <Route path="stores" element={<StoresPage />} />
            <Route path="admin/tenants" element={<RequireSuperAdmin><TenantManagement /></RequireSuperAdmin>} />
            <Route path="admin/users" element={<RequireSuperAdmin><UserManagement /></RequireSuperAdmin>} />
          </Route>
        </Routes>
      </BrowserRouter>
      <Toaster position="bottom-right" />
    </div>
  );
}

export default App;
