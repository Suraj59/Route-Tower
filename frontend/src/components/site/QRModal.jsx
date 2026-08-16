import { useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { QRCodeCanvas } from "qrcode.react";
import { X, Download, Copy } from "lucide-react";
import { toast } from "sonner";
import { trackingLink } from "@/lib/share";

export default function QRModal({ open, onClose, shipment }) {
  const wrapRef = useRef(null);
  if (!shipment) return null;
  const link = trackingLink(shipment);

  const download = () => {
    const canvas = wrapRef.current?.querySelector("canvas");
    if (!canvas) return;
    const a = document.createElement("a");
    a.href = canvas.toDataURL("image/png");
    a.download = `${shipment.id}-tracking-qr.png`;
    a.click();
    toast.success("QR code downloaded");
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-[100] flex items-center justify-center p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} data-testid="qr-modal">
          <div className="absolute inset-0 bg-ct-ink/40 backdrop-blur-sm" onClick={onClose} />
          <motion.div className="relative bg-white w-full max-w-sm border border-ct-line" initial={{ scale: 0.96, y: 20, opacity: 0 }} animate={{ scale: 1, y: 0, opacity: 1 }} exit={{ scale: 0.96, y: 20, opacity: 0 }} transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}>
            <button onClick={onClose} className="absolute right-4 top-4 text-ct-gray3 hover:text-ct-ink z-10" data-testid="qr-close"><X size={20} /></button>
            <div className="p-8 text-center">
              <span className="font-mono text-[11px] tracking-[0.25em] uppercase text-ct-orange">Tracking QR</span>
              <h3 className="font-display text-2xl tracking-tight text-ct-ink mt-1 mb-1">{shipment.id}</h3>
              <p className="text-xs text-ct-gray2 mb-6">Scan to open the public tracking page — ready for labels &amp; packing slips.</p>
              <div ref={wrapRef} className="inline-flex p-4 border border-ct-line bg-white" data-testid="qr-canvas">
                <QRCodeCanvas value={link} size={200} fgColor="#111111" bgColor="#FFFFFF" level="M" includeMargin={false} imageSettings={undefined} />
              </div>
              <div className="flex gap-2 mt-6">
                <button onClick={download} className="flex-1 bg-ct-ink text-white text-sm font-medium py-2.5 hover:bg-ct-orange transition-colors inline-flex items-center justify-center gap-2" data-testid="qr-download"><Download size={15} /> Download PNG</button>
                <button onClick={() => { navigator.clipboard?.writeText(link); toast.success("Link copied"); }} className="border border-ct-line text-ct-ink text-sm px-4 hover:border-ct-ink transition-colors inline-flex items-center gap-2" data-testid="qr-copy"><Copy size={15} /></button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
