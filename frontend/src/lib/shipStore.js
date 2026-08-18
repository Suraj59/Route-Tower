import { useEffect, useSyncExternalStore } from "react";
import { authApi, getToken } from "@/lib/auth";

// Shipments now live in MongoDB, scoped to the logged-in user's tenant (see backend /api/shipments).
let cache = [];
let loaded = false;
let loading = null;
let listeners = new Set();

const normalize = (s) => {
  if (s.stops && !s.routeCoords) s.routeCoords = s.stops.map((p) => [p.lng, p.lat]);
  if (s.stops && !s.route) s.route = s.stops.map((p) => p.city);
  return s;
};

const emit = () => listeners.forEach((l) => l());

export const loadShipments = async () => {
  if (!getToken()) {
    cache = [];
    loaded = true;
    emit();
    return;
  }
  loading = authApi
    .get("/shipments")
    .then(({ data }) => { cache = data.map(normalize); })
    .catch(() => { cache = []; })
    .finally(() => {
      loaded = true;
      loading = null;
      emit();
    });
  return loading;
};

const subscribe = (cb) => {
  listeners.add(cb);
  return () => listeners.delete(cb);
};

export const useShipments = () => {
  const shipments = useSyncExternalStore(subscribe, () => cache);
  useEffect(() => {
    if (!loaded && !loading) loadShipments();
  }, []);
  return shipments;
};

export const addShipment = async (s) => {
  const saved = await authApi.post("/shipments", s).then((r) => r.data);
  await loadShipments();
  return normalize(saved);
};

// patches the shipment on the backend (tenant + permission checked server-side)
export const patchShipment = async (id, patch) => {
  await authApi.put(`/shipments/${id}`, patch);
  await loadShipments();
};

export const removeShipment = async (id) => {
  await authApi.delete(`/shipments/${id}`);
  await loadShipments();
};

// call on logout so the next login starts from a clean slate
export const resetShipments = () => {
  cache = [];
  loaded = false;
  emit();
};

export const routeCoordsOf = (s) => s.routeCoords || [];
