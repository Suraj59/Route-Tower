import { motion } from "framer-motion";
import { forwardRef } from "react";

export const Reveal = forwardRef(({ children, delay = 0, y = 28, className = "" }, ref) => (
  <motion.div
    ref={ref}
    className={className}
    initial={{ opacity: 0, y }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: "-80px" }}
    transition={{ duration: 0.7, delay, ease: [0.16, 1, 0.3, 1] }}
  >
    {children}
  </motion.div>
));
Reveal.displayName = "Reveal";

export const MonoLabel = ({ children, className = "" }) => (
  <span className={`font-mono text-[11px] tracking-[0.25em] uppercase text-ct-gray3 ${className}`}>
    {children}
  </span>
);

export const SectionTag = ({ n, children }) => (
  <div className="flex items-center gap-3 mb-6">
    <span className="font-mono text-[11px] tracking-[0.25em] text-ct-orange">{n}</span>
    <span className="h-px w-8 bg-ct-line" />
    <span className="font-mono text-[11px] tracking-[0.25em] uppercase text-ct-gray3">{children}</span>
  </div>
);
