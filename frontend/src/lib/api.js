import axios from "axios";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export const aiCreateShipment = (prompt) =>
  axios.post(`${API}/ai/create-shipment`, { prompt }).then((r) => r.data.shipment);

export const aiInsight = (shipment, question) =>
  axios.post(`${API}/ai/insight`, { shipment, question }).then((r) => r.data.insight);

export const createLead = (payload) => axios.post(`${API}/leads`, payload);
