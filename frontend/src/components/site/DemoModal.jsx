import { useState } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import { X, Check } from "lucide-react";
import { toast } from "sonner";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function DemoModal({ open, onClose }) {
  const [form, setForm] = useState({ name: "", email: "", company: "", role: "", shipment_volume: "", message: "" });
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.company) {
      toast.error("Please fill in name, email and company.");
      return;
    }
    setLoading(true);
    try {
      await axios.post(`${API}/leads`, form);
      setDone(true);
      toast.success("Demo request received. We'll be in touch.");
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const close = () => {
    onClose();
    setTimeout(() => { setDone(false); setForm({ name: "", email: "", company: "", role: "", shipment_volume: "", message: "" }); }, 300);
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          data-testid="demo-modal"
        >
          <div className="absolute inset-0 bg-ct-ink/40 backdrop-blur-sm" onClick={close} />
          <motion.div
            className="relative bg-white w-full max-w-lg border border-ct-line"
            initial={{ scale: 0.96, y: 20, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.96, y: 20, opacity: 0 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          >
            <button onClick={close} className="absolute right-4 top-4 text-ct-gray3 hover:text-ct-ink" data-testid="demo-modal-close">
              <X size={20} />
            </button>

            {done ? (
              <div className="p-10 text-center" data-testid="demo-success">
                <div className="h-14 w-14 bg-ct-orangelight text-ct-orange grid place-items-center mx-auto mb-5">
                  <Check size={26} />
                </div>
                <h3 className="font-display text-2xl tracking-tight text-ct-ink">Request received</h3>
                <p className="text-ct-gray2 mt-2 text-sm">Our team will reach out to schedule your Route Tower walkthrough.</p>
                <button onClick={close} className="mt-6 bg-ct-ink text-white text-sm px-6 py-2.5 hover:bg-ct-orange transition-colors" data-testid="demo-success-close">
                  Done
                </button>
              </div>
            ) : (
              <div className="p-8">
                <span className="font-mono text-[11px] tracking-[0.25em] uppercase text-ct-orange">Request a Demo</span>
                <h3 className="font-display text-2xl md:text-3xl tracking-tight text-ct-ink mt-2 mb-6">
                  See every shipment in one view.
                </h3>
                <form onSubmit={submit} className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <input value={form.name} onChange={set("name")} placeholder="Full name*" className="border border-ct-line px-3.5 py-2.5 text-sm focus:outline-none focus:border-ct-ink transition-colors" data-testid="demo-name" />
                    <input value={form.company} onChange={set("company")} placeholder="Company*" className="border border-ct-line px-3.5 py-2.5 text-sm focus:outline-none focus:border-ct-ink transition-colors" data-testid="demo-company" />
                  </div>
                  <input value={form.email} onChange={set("email")} type="email" placeholder="Work email*" className="w-full border border-ct-line px-3.5 py-2.5 text-sm focus:outline-none focus:border-ct-ink transition-colors" data-testid="demo-email" />
                  <div className="grid grid-cols-2 gap-3">
                    <input value={form.role} onChange={set("role")} placeholder="Role" className="border border-ct-line px-3.5 py-2.5 text-sm focus:outline-none focus:border-ct-ink transition-colors" data-testid="demo-role" />
                    <select value={form.shipment_volume} onChange={set("shipment_volume")} className="border border-ct-line px-3.5 py-2.5 text-sm text-ct-gray2 focus:outline-none focus:border-ct-ink transition-colors" data-testid="demo-volume">
                      <option value="">Monthly volume</option>
                      <option>&lt; 1,000</option>
                      <option>1,000 – 10,000</option>
                      <option>10,000 – 100,000</option>
                      <option>100,000+</option>
                    </select>
                  </div>
                  <textarea value={form.message} onChange={set("message")} placeholder="What visibility challenge are you solving?" rows={3} className="w-full border border-ct-line px-3.5 py-2.5 text-sm focus:outline-none focus:border-ct-ink transition-colors resize-none" data-testid="demo-message" />
                  <button type="submit" disabled={loading} className="w-full bg-ct-orange text-white text-sm font-medium py-3 hover:bg-ct-orangehover transition-colors disabled:opacity-60" data-testid="demo-submit">
                    {loading ? "Sending…" : "Request a Demo"}
                  </button>
                </form>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
