import { useSyncExternalStore } from "react";
import { SHIPMENTS, CITIES, STATUS } from "@/lib/data";

const KEY = "rt_shipments_v1";
const OKEY = "rt_overrides_v1";
let listeners = new Set();

const read = (k) => {
  try {
    const raw = localStorage.getItem(k);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

let created = read(KEY) || [];
let overrides = read(OKEY) || {}; // { id: { status, ... } }
let cache = null;

const buildCache = () => {
  cache = [...created, ...SHIPMENTS].map((s) =>
    overrides[s.id] ? { ...s, ...overrides[s.id] } : s
  );
  return cache;
};
buildCache();

const emit = () => {
  buildCache();
  listeners.forEach((l) => l());
};

export const addShipment = (s) => {
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

// patch works for both seed and created shipments (via overrides layer)
export const patchShipment = (id, patch) => {
  overrides = { ...overrides, [id]: { ...(overrides[id] || {}), ...patch } };
  localStorage.setItem(OKEY, JSON.stringify(overrides));
  emit();
};

const subscribe = (cb) => {
  listeners.add(cb);
  return () => listeners.delete(cb);
};

export const useShipments = () => useSyncExternalStore(subscribe, () => cache);

export const routeCoordsOf = (s) =>
  s.routeCoords || s.route.map((c) => CITIES[c]).filter(Boolean);
