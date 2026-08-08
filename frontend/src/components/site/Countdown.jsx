import { useState, useEffect } from "react";

const parseEta = (eta) => {
  const d = new Date(eta);
  return isNaN(d.getTime()) ? null : d;
};

export default function Countdown({ eta, status, className = "", compact = false }) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  if (status === "delivered") {
    return <span className={`font-mono ${className}`} data-testid="countdown">Delivered</span>;
  }
  const target = parseEta(eta);
  if (!target) return <span className={`font-mono ${className}`} data-testid="countdown">{eta}</span>;

  let diff = Math.max(0, target.getTime() - now);
  const d = Math.floor(diff / 86400000); diff -= d * 86400000;
  const h = Math.floor(diff / 3600000); diff -= h * 3600000;
  const m = Math.floor(diff / 60000); diff -= m * 60000;
  const s = Math.floor(diff / 1000);

  if (target.getTime() <= now) {
    return <span className={`font-mono text-status-delivered ${className}`} data-testid="countdown">Arriving now</span>;
  }

  const Cell = ({ v, u }) => (
    <span className="inline-flex items-baseline gap-0.5">
      <span className="tabular-nums font-semibold">{String(v).padStart(2, "0")}</span>
      <span className="text-[0.7em] opacity-60">{u}</span>
    </span>
  );

  if (compact) {
    return (
      <span className={`font-mono ${className}`} data-testid="countdown">
        {d > 0 ? `${d}d ` : ""}{String(h).padStart(2, "0")}:{String(m).padStart(2, "0")}:{String(s).padStart(2, "0")}
      </span>
    );
  }

  return (
    <span className={`font-mono inline-flex items-center gap-2 ${className}`} data-testid="countdown">
      <Cell v={d} u="d" /><span className="opacity-30">:</span>
      <Cell v={h} u="h" /><span className="opacity-30">:</span>
      <Cell v={m} u="m" /><span className="opacity-30">:</span>
      <Cell v={s} u="s" />
    </span>
  );
}
