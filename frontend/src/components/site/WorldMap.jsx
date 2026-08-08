import { useState } from "react";
import { ComposableMap, Geographies, Geography, Line, Marker } from "react-simple-maps";
import { CITIES, STATUS } from "@/lib/data";

const GEO_URL = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

// Great-circle-ish curved path between two points
const curve = (from, to, bend = 0.2) => {
  const mx = (from[0] + to[0]) / 2;
  const my = (from[1] + to[1]) / 2;
  const dx = to[0] - from[0];
  const dy = to[1] - from[1];
  return [mx - dy * bend, my + dx * bend];
};

export default function WorldMap({ shipments, activeId, onSelect }) {
  const [hover, setHover] = useState(null);

  return (
    <div className="relative w-full" data-testid="world-map">
      <ComposableMap
        projection="geoMercator"
        projectionConfig={{ scale: 135, center: [10, 30] }}
        style={{ width: "100%", height: "auto" }}
      >
        <Geographies geography={GEO_URL}>
          {({ geographies }) =>
            geographies.map((geo) => (
              <Geography
                key={geo.rsmKey}
                geography={geo}
                fill="#F0F0F2"
                stroke="#E5E5EA"
                strokeWidth={0.5}
                style={{
                  default: { outline: "none" },
                  hover: { fill: "#E9E9EC", outline: "none" },
                  pressed: { outline: "none" },
                }}
              />
            ))
          }
        </Geographies>

        {shipments.map((s) => {
          const isActive = s.id === activeId;
          const color = STATUS[s.status].color;
          const pts = s.route.map((c) => CITIES[c]).filter(Boolean);
          return pts.slice(0, -1).map((p, i) => {
            const q = pts[i + 1];
            return (
              <Line
                key={`${s.id}-${i}`}
                from={p}
                to={q}
                stroke={color}
                strokeWidth={isActive ? 2 : 1}
                strokeOpacity={isActive ? 0.95 : 0.28}
                strokeLinecap="round"
                className={isActive ? "route-dash" : ""}
              />
            );
          });
        })}

        {shipments.map((s) => {
          const color = STATUS[s.status].color;
          const isActive = s.id === activeId;
          return s.route.map((c, idx) => {
            const coord = CITIES[c];
            if (!coord) return null;
            const isNode = idx === 0 || idx === s.route.length - 1;
            return (
              <Marker key={`${s.id}-m-${idx}`} coordinates={coord}>
                {isActive && isNode && (
                  <circle r={9} fill={color} opacity={0.25} className="animate-pulse-ring" />
                )}
                <circle
                  r={isNode ? (isActive ? 5 : 3.5) : 2}
                  fill={isNode ? color : "#fff"}
                  stroke={color}
                  strokeWidth={1.4}
                  style={{ cursor: "pointer" }}
                  onMouseEnter={() => setHover({ id: s.id, city: c, status: s.status })}
                  onMouseLeave={() => setHover(null)}
                  onClick={() => onSelect && onSelect(s.id)}
                  data-testid={`map-marker-${s.id}-${idx}`}
                />
              </Marker>
            );
          });
        })}
      </ComposableMap>

      {hover && (
        <div className="pointer-events-none absolute left-4 top-4 bg-ct-ink text-white px-3 py-2 font-mono text-[11px] tracking-wide">
          {hover.id} · {hover.city} · {STATUS[hover.status].label}
        </div>
      )}
    </div>
  );
}
