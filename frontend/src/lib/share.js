// Encode/decode a shipment payload for shareable public tracking links (no backend needed)
export const encodeShipment = (s) => {
  try {
    const slim = {
      id: s.id, status: s.status, mode: s.mode, origin: s.origin, destination: s.destination,
      carrier: s.carrier, tracking: s.tracking, eta: s.eta, current: s.current,
      stops: s.stops, route: s.route, routeCoords: s.routeCoords,
    };
    return btoa(encodeURIComponent(JSON.stringify(slim)));
  } catch {
    return "";
  }
};

export const decodeShipment = (str) => {
  try {
    return JSON.parse(decodeURIComponent(atob(str)));
  } catch {
    return null;
  }
};

export const trackingLink = (s) =>
  `${window.location.origin}/track/${s.id}?d=${encodeShipment(s)}`;
