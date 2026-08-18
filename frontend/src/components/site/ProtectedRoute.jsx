import { Navigate, useLocation } from "react-router-dom";
import { isAuthenticated, isSuperAdmin } from "@/lib/auth";

export function RequireAuth({ children }) {
  const location = useLocation();
  if (!isAuthenticated()) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }
  return children;
}

export function RequireSuperAdmin({ children }) {
  const location = useLocation();
  if (!isAuthenticated()) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }
  if (!isSuperAdmin()) {
    return <Navigate to="/app" replace />;
  }
  return children;
}
