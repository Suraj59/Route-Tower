import axios from "axios";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
const ai = axios.create({ baseURL: API, timeout: 30000 });

export const aiCreateShipment = (prompt) =>
  ai.post(`/ai/create-shipment`, { prompt }).then((r) => r.data.shipment);

export const aiInsight = (shipment, question) =>
  ai.post(`/ai/insight`, { shipment, question }).then((r) => r.data.insight);

export const aiNormalizeCsv = (csv) =>
  ai.post(`/ai/normalize-csv`, { csv }).then((r) => r.data.shipments);

export const aiAlerts = (shipments) =>
  ai.post(`/ai/alerts`, { shipments }).then((r) => r.data.alerts);

export const createLead = (payload) => axios.post(`${API}/leads`, payload);
