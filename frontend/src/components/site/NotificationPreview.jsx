import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, MessageSquare, Bell, Check } from "lucide-react";
import { Reveal, SectionTag } from "./Primitives";
import { NOTIFICATIONS } from "@/lib/data";

const channelIcon = { Email: Mail, SMS: MessageSquare, Push: Bell };
const channelColor = { Email: "#007AFF", SMS: "#34C759", Push: "#FF4500" };

export default function NotificationPreview() {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setStep((s) => (s + 1) % (NOTIFICATIONS.length + 1)), 1800);
    return () => clearInterval(t);
  }, []);

  const visible = NOTIFICATIONS.slice(0, step);
  const shown = visible.slice(-4);

  return (
    <section className="max-w-[1400px] mx-auto px-6 md:px-10 py-28 md:py-36" data-testid="notification-preview">
      <SectionTag n="09B">Customer Notifications</SectionTag>
      <div className="grid md:grid-cols-2 gap-14 items-center">
        <Reveal>
          <h2 className="font-display text-4xl sm:text-5xl tracking-tighter leading-[0.95] text-ct-ink mb-6">
            Every milestone, delivered to your customer.
          </h2>
          <p className="text-ct-gray2 leading-relaxed max-w-md mb-8">
            Configurable notifications fire automatically as the shipment progresses — across email, SMS, push, webhooks and a branded customer portal. Watch the post-purchase journey play out.
          </p>
          <div className="flex flex-wrap gap-2">
            {["Email", "SMS", "Push", "Webhook", "Portal"].map((c) => (
              <span key={c} className="font-mono text-[11px] tracking-wide border border-ct-line px-3 py-1.5 text-ct-gray2 bg-white">{c}</span>
            ))}
          </div>
        </Reveal>

        <Reveal delay={0.1}>
          <div className="flex justify-center">
            {/* Phone mockup */}
            <div className="relative w-[300px] h-[600px] bg-ct-ink rounded-[42px] p-3 shadow-2xl">
              <div className="absolute top-3 left-1/2 -translate-x-1/2 w-32 h-6 bg-ct-ink rounded-b-2xl z-20" />
              <div className="relative w-full h-full bg-ct-bg2 rounded-[32px] overflow-hidden">
                <div className="bg-white/80 backdrop-blur px-5 pt-8 pb-3 border-b border-ct-line flex items-center justify-between">
                  <span className="font-mono text-[10px] tracking-wide text-ct-gray3">9:41</span>
                  <span className="font-display font-extrabold text-sm text-ct-ink">Route Tower</span>
                  <span className="h-2 w-2 rounded-full bg-status-delivered animate-pulse" />
                </div>
                <div className="p-3 space-y-2.5 h-[calc(100%-56px)] flex flex-col justify-start">
                  <AnimatePresence mode="popLayout">
                    {shown.map((n) => {
                      const Icon = channelIcon[n.channel];
                      const isLast = n.title === "Delivered" && step > NOTIFICATIONS.length - 1;
                      return (
                        <motion.div
                          key={n.title}
                          layout
                          initial={{ opacity: 0, y: 24, scale: 0.96 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.94 }}
                          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                          className="bg-white border border-ct-line rounded-2xl p-3.5"
                        >
                          <div className="flex items-center gap-2 mb-1.5">
                            <span className="h-6 w-6 rounded-lg grid place-items-center text-white" style={{ background: channelColor[n.channel] }}>
                              {isLast ? <Check size={13} /> : <Icon size={13} />}
                            </span>
                            <span className="font-mono text-[9px] tracking-[0.15em] uppercase text-ct-gray3">{n.channel}</span>
                            <span className="ml-auto font-mono text-[9px] text-ct-gray3">{n.time}</span>
                          </div>
                          <div className="text-sm font-semibold text-ct-ink">{n.title}</div>
                          <div className="text-[11px] text-ct-gray2 leading-snug mt-0.5">{n.body}</div>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                  {step === 0 && (
                    <div className="text-center text-ct-gray3 text-xs font-mono mt-8">Waiting for shipment events…</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
