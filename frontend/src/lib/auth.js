import axios from "axios";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
const TOKEN_KEY = "rt_token";
const USER_KEY = "rt_user";

export const authApi = axios.create({ baseURL: API, timeout: 15000 });

authApi.interceptors.request.use((config) => {
  const token = getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

let onUnauthorized = () => {};
export const setOnUnauthorized = (fn) => { onUnauthorized = fn; };

authApi.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err?.response?.status === 401) {
      logout();
      onUnauthorized();
    }
    return Promise.reject(err);
  }
);

export const getToken = () => localStorage.getItem(TOKEN_KEY);

export const getUser = () => {
  try {
    return JSON.parse(localStorage.getItem(USER_KEY) || "null");
  } catch {
    return null;
  }
};

export const isAuthenticated = () => !!getToken();
export const isSuperAdmin = () => getUser()?.role === "superadmin";

const ROLE_PERMISSIONS = {
  superadmin: ["view", "edit", "delete"],
  admin: ["view", "edit", "delete"],
  editor: ["view", "edit"],
  viewer: ["view"],
};

export const can = (perm) => ROLE_PERMISSIONS[getUser()?.role]?.includes(perm) ?? false;

export const setSession = (data) => {
  localStorage.setItem(TOKEN_KEY, data.access_token);
  localStorage.setItem(USER_KEY, JSON.stringify(data.user));
  return data.user;
};

export const login = async (email, password) => {
  const { data } = await authApi.post("/auth/login", { email, password });
  return setSession(data);
};

export const logout = () => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
};
