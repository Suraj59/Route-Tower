import { useSyncExternalStore } from "react";
import { SHIPMENTS, CITIES, STATUS } from "@/lib/data";

const KEY = "rt_shipments_v1";
let listeners = new Set();

const read = () => {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

let created = read();
let cache = null;

const buildCache = () => {
  cache = [...created, ...SHIPMENTS];
  return cache;
};
buildCache();

const emit = () => {
  buildCache();
  listeners.forEach((l) => l());
};

export const addShipment = (s) => {
  // ensure routeCoords + route names present
  if (s.stops && !s.routeCoords) s.routeCoords = s.stops.map((p) => [p.lng, p.lat]);
  if (s.stops && !s.route) s.route = s.stops.map((p) => p.city);
  if (!STATUS[s.status]) s.status = "in_transit"; // normalise unknown statuses
  s.createdByUser = true;
  created = [s, ...created];
  localStorage.setItem(KEY, JSON.stringify(created));
  emit();
  return s;
};

export const removeShipment = (id) => {
  created = created.filter((s) => s.id !== id);
  localStorage.setItem(KEY, JSON.stringify(created));
  emit();
};

const subscribe = (cb) => {
  listeners.add(cb);
  return () => listeners.delete(cb);
};

export const useShipments = () => useSyncExternalStore(subscribe, () => cache);

// coordinates for a shipment route (works for seed + created)
export const routeCoordsOf = (s) =>
  s.routeCoords || s.route.map((c) => CITIES[c]).filter(Boolean);
