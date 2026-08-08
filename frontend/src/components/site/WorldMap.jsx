import { useState } from "react";
import { ComposableMap, Geographies, Geography, Line, Marker } from "react-simple-maps";
import { useAnimationFrame } from "framer-motion";
import { STATUS } from "@/lib/data";
import { routeCoordsOf } from "@/lib/shipStore";

const GEO_URL = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

const pointAt = (pts, f) => {
  if (!pts || pts.length < 2) return pts && pts[0];
  const segLens = [];
  let total = 0;
  for (let i = 0; i < pts.length - 1; i++) {
    const dx = pts[i + 1][0] - pts[i][0];
    const dy = pts[i + 1][1] - pts[i][1];
    const l = Math.hypot(dx, dy);
    segLens.push(l);
    total += l;
  }
  let dist = f * total;
  for (let i = 0; i < segLens.length; i++) {
    if (dist <= segLens[i] || i === segLens.length - 1) {
      const r = segLens[i] === 0 ? 0 : dist / segLens[i];
      return [pts[i][0] + (pts[i + 1][0] - pts[i][0]) * r, pts[i][1] + (pts[i + 1][1] - pts[i][1]) * r];
    }
    dist -= segLens[i];
  }
  return pts[pts.length - 1];
};

function MovingDot({ shipment, offset }) {
  const [pos, setPos] = useState(null);
  const pts = routeCoordsOf(shipment);
  const color = STATUS[shipment.status].color;
  useAnimationFrame((t) => {
    if (!pts || pts.length < 2) return;
    const f = ((t / 16000 + offset) % 1 + 1) % 1;
    setPos(pointAt(pts, f));
  });
  if (!pos) return null;
  return (
    <Marker coordinates={pos}>
      <circle r={7} fill={color} opacity={0.18} className="animate-pulse-ring" />
      <circle r={3.5} fill={color} stroke="#fff" strokeWidth={1.4} />
    </Marker>
  );
}

export default function WorldMap({ shipments, activeId, onSelect, animate = true, playbackProgress = null, geoFill = "#F0F0F2", geoStroke = "#E5E5EA" }) {
  const [hover, setHover] = useState(null);

  return (
    <div className="relative w-full" data-testid="world-map">
      <ComposableMap projection="geoMercator" projectionConfig={{ scale: 135, center: [10, 30] }} style={{ width: "100%", height: "auto" }}>
        <Geographies geography={GEO_URL}>
          {({ geographies }) =>
            geographies.map((geo) => (
              <Geography key={geo.rsmKey} geography={geo} fill={geoFill} stroke={geoStroke} strokeWidth={0.5}
                style={{ default: { outline: "none" }, hover: { fill: geoFill, outline: "none" }, pressed: { outline: "none" } }} />
            ))
          }
        </Geographies>

        {shipments.map((s) => {
          const isActive = s.id === activeId;
          const color = STATUS[s.status].color;
          const pts = routeCoordsOf(s);
          return pts.slice(0, -1).map((p, i) => (
            <Line key={`${s.id}-${i}`} from={p} to={pts[i + 1]} stroke={color} strokeWidth={isActive ? 2 : 1}
              strokeOpacity={isActive ? 0.95 : 0.28} strokeLinecap="round" className={isActive ? "route-dash" : ""} />
          ));
        })}

        {shipments.map((s) => {
          const color = STATUS[s.status].color;
          const isActive = s.id === activeId;
          const pts = routeCoordsOf(s);
          const labels = s.route || (s.stops && s.stops.map((x) => x.city)) || [];
          return pts.map((coord, idx) => {
            const isNode = idx === 0 || idx === pts.length - 1;
            return (
              <Marker key={`${s.id}-m-${idx}`} coordinates={coord}>
                <circle r={isNode ? (isActive ? 5 : 3.5) : 2} fill={isNode ? color : "#fff"} stroke={color} strokeWidth={1.4}
                  style={{ cursor: "pointer" }}
                  onMouseEnter={() => setHover({ id: s.id, city: labels[idx] || "", status: s.status })}
                  onMouseLeave={() => setHover(null)}
                  onClick={() => onSelect && onSelect(s.id)}
                  data-testid={`map-marker-${s.id}-${idx}`} />
              </Marker>
            );
          });
        })}

        {/* Playback marker (single active shipment) */}
        {playbackProgress !== null && activeId &&
          (() => {
            const s = shipments.find((x) => x.id === activeId);
            if (!s) return null;
            const pts = routeCoordsOf(s);
            const pos = pointAt(pts, playbackProgress);
            const color = STATUS[s.status].color;
            if (!pos) return null;
            return (
              <Marker coordinates={pos}>
                <circle r={10} fill={color} opacity={0.2} />
                <circle r={5} fill={color} stroke="#fff" strokeWidth={2} data-testid="playback-marker" />
              </Marker>
            );
          })()}

        {animate && playbackProgress === null &&
          shipments.filter((s) => s.status !== "delivered").map((s, i) => (
            <MovingDot key={`mv-${s.id}`} shipment={s} offset={(i * 0.17) % 1} />
          ))}
      </ComposableMap>

      {hover && (
        <div className="pointer-events-none absolute left-4 top-4 bg-ct-ink text-white px-3 py-2 font-mono text-[11px] tracking-wide">
          {hover.id} · {hover.city} · {STATUS[hover.status].label}
        </div>
      )}
    </div>
  );
}
