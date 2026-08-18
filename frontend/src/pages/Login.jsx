import { useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Radar, Loader2, LogIn } from "lucide-react";
import { toast } from "sonner";
import { login } from "@/lib/auth";
import { loadShipments } from "@/lib/shipStore";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const submit = async (e) => {
    e.preventDefault();
    if (!email || !password) { toast.error("Enter email and password."); return; }
    setLoading(true);
    try {
      await login(email, password);
      await loadShipments();
      const from = location.state?.from || "/app";
      toast.success("Logged in");
      navigate(from, { replace: true });
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Invalid email or password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-ct-bg2 flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-sm border border-ct-line bg-white p-8"
        data-testid="login-page"
      >
        <Link to="/" className="flex items-center gap-2.5 mb-8 w-fit">
          <div className="h-8 w-8 bg-ct-ink text-ct-orange grid place-items-center">
            <Radar className="h-4.5 w-4.5" strokeWidth={1.8} size={18} />
          </div>
          <span className="font-display font-extrabold text-[15px] tracking-tight text-ct-ink">
            Route Tower<span className="text-ct-orange">.</span>
          </span>
        </Link>

        <h1 className="font-display text-2xl tracking-tight text-ct-ink mb-1">Sign in</h1>
        <p className="text-sm text-ct-gray2 mb-6">Access your Route Tower control tower.</p>

        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="block font-mono text-[10px] tracking-wide uppercase text-ct-gray3 mb-1.5">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
              className="w-full border border-ct-line px-3.5 py-2.5 text-sm focus:outline-none focus:border-ct-ink"
              data-testid="login-email"
              autoComplete="username"
            />
          </div>
          <div>
            <label className="block font-mono text-[10px] tracking-wide uppercase text-ct-gray3 mb-1.5">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full border border-ct-line px-3.5 py-2.5 text-sm focus:outline-none focus:border-ct-ink"
              data-testid="login-password"
              autoComplete="current-password"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full inline-flex items-center justify-center gap-2 bg-ct-ink text-white text-sm font-medium py-3 hover:bg-ct-orange transition-colors disabled:opacity-60"
            data-testid="login-submit"
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : <LogIn size={16} />}
            Sign in
          </button>
        </form>
      </motion.div>
    </div>
  );
}
