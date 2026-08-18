import { authApi } from "@/lib/auth";

export const listTenants = () => authApi.get("/tenants").then((r) => r.data);
export const createTenant = (name) => authApi.post("/tenants", { name }).then((r) => r.data);
export const getMyTenant = () => authApi.get("/tenants/me").then((r) => r.data);
export const updateTenant = (id, patch) => authApi.put(`/tenants/${id}`, patch).then((r) => r.data);

export const listUsers = () => authApi.get("/users").then((r) => r.data);
export const createUser = (payload) => authApi.post("/users", payload).then((r) => r.data);
export const updateUserTenantAccess = (userId, tenant_access) => authApi.put(`/users/${userId}/tenant-access`, { tenant_access }).then((r) => r.data);

export const listAccessibleTenants = () => authApi.get("/tenants/accessible").then((r) => r.data);
export const switchTenant = (tenant_id) => authApi.post("/auth/switch-tenant", { tenant_id }).then((r) => r.data);

export const listProviders = () => authApi.get("/providers").then((r) => r.data);
export const createProvider = (payload) => authApi.post("/providers", payload).then((r) => r.data);
export const updateProvider = (id, patch) => authApi.put(`/providers/${id}`, patch).then((r) => r.data);
export const removeProvider = (id) => authApi.delete(`/providers/${id}`).then((r) => r.data);

export const listStores = () => authApi.get("/stores").then((r) => r.data);
export const createStore = (payload) => authApi.post("/stores", payload).then((r) => r.data);
export const updateStore = (id, patch) => authApi.put(`/stores/${id}`, patch).then((r) => r.data);
export const removeStore = (id) => authApi.delete(`/stores/${id}`).then((r) => r.data);

export const listWebhooks = () => authApi.get("/webhooks").then((r) => r.data);
export const createWebhook = (payload) => authApi.post("/webhooks", payload).then((r) => r.data);
export const updateWebhook = (id, patch) => authApi.put(`/webhooks/${id}`, patch).then((r) => r.data);
export const removeWebhook = (id) => authApi.delete(`/webhooks/${id}`).then((r) => r.data);

export const getPostPurchase = () => authApi.get("/post-purchase").then((r) => r.data);
export const updatePostPurchase = (payload) => authApi.put("/post-purchase", payload).then((r) => r.data);
