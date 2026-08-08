import axios from "axios";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export const aiCreateShipment = (prompt) =>
  axios.post(`${API}/ai/create-shipment`, { prompt }).then((r) => r.data.shipment);

export const aiInsight = (shipment, question) =>
  axios.post(`${API}/ai/insight`, { shipment, question }).then((r) => r.data.insight);

export const aiNormalizeCsv = (csv) =>
  axios.post(`${API}/ai/normalize-csv`, { csv }).then((r) => r.data.shipments);

export const aiAlerts = (shipments) =>
  axios.post(`${API}/ai/alerts`, { shipments }).then((r) => r.data.alerts);

export const createLead = (payload) => axios.post(`${API}/leads`, payload);
