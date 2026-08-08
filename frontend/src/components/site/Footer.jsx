import { Radar } from "lucide-react";

export default function Footer({ onDemo }) {
  return (
    <footer className="bg-ct-ink text-white" data-testid="site-footer">
      <div className="max-w-[1400px] mx-auto px-6 md:px-10 py-20">
        <div className="grid md:grid-cols-12 gap-10">
          <div className="md:col-span-5">
            <div className="flex items-center gap-2.5 mb-6">
              <div className="h-8 w-8 bg-ct-orange text-ct-ink grid place-items-center">
                <Radar size={18} strokeWidth={1.8} />
              </div>
              <span className="font-display font-extrabold text-lg tracking-tight">Route Tower</span>
            </div>
            <p className="font-display text-2xl md:text-3xl tracking-tight leading-tight max-w-md">
              Every shipment. Every carrier. Every mode. Every event. One intelligent Route Tower.
            </p>
            <button onClick={onDemo} className="mt-8 bg-ct-orange text-white text-sm font-medium px-6 py-3 hover:bg-ct-orangehover transition-colors" data-testid="footer-demo-btn">
              Request a Demo
            </button>
          </div>
          <div className="md:col-span-7 grid grid-cols-2 sm:grid-cols-3 gap-8 md:pl-12">
            {[
              { h: "Platform", items: ["Unified Visibility", "Event Normalization", "Exception Intelligence", "Orchestration"] },
              { h: "Modes", items: ["Road", "Ocean", "Air", "Rail", "Multimodal"] },
              { h: "Company", items: ["Vision", "Who We Serve", "Security", "Contact"] },
            ].map((col) => (
              <div key={col.h}>
                <div className="font-mono text-[11px] tracking-[0.25em] uppercase text-ct-gray3 mb-4">{col.h}</div>
                <ul className="space-y-2.5">
                  {col.items.map((i) => (
                    <li key={i} className="text-sm text-white/70 hover:text-white transition-colors cursor-default">{i}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
        <div className="mt-16 pt-8 border-t border-white/10 flex flex-col sm:flex-row justify-between gap-4">
          <span className="font-mono text-[11px] tracking-wide text-white/40">© 2026 ROUTE TOWER · DEMO DATA ONLY</span>
          <span className="font-mono text-[11px] tracking-wide text-white/40">FIRST MILE → MIDDLE MILE → LAST MILE</span>
        </div>
      </div>
    </footer>
  );
}
