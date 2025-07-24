const API_BASE = "http://localhost:8000/api";

function getAuthHeaders() {
  const token = JSON.parse(localStorage.getItem("mes_user_token"));
  return token ? { Authorization: `Bearer ${token}` } : {};
}

// Centralized fetch with 401 handling
async function fetchWithAuth(url, options = {}) {
  const res = await fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      ...getAuthHeaders(),
    },
  });
  if (res.status === 401) {
    localStorage.removeItem("mes_user_token");
    window.location.href = "/login";
    throw new Error("Session expired. Please log in again.");
  }
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function loginUser(username, password) {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ username, password }),
  });
  if (!res.ok) throw new Error("Invalid username or password");
  return await res.json();
}

// Machines
export async function fetchMachines() {
  const res = await fetchWithAuth(`${API_BASE}/machines/`);
  return res.machines;
}
export async function createMachine(data) {
  return fetchWithAuth(`${API_BASE}/machines/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
}
export async function updateMachine(id, data) {
  return fetchWithAuth(`${API_BASE}/machines/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
}
export async function deleteMachine(id) {
  return fetchWithAuth(`${API_BASE}/machines/${id}`, { method: "DELETE" });
}

// Work Orders
export async function fetchWorkOrders() {
  const res = await fetchWithAuth(`${API_BASE}/workorders/`);
  return res.work_orders;
}
export async function createWorkOrder(data) {
  return fetchWithAuth(`${API_BASE}/workorders/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...data, operator_id: data.operatorId, comments: data.comments }),
  });
}
export async function updateWorkOrder(id, data) {
  return fetchWithAuth(`${API_BASE}/workorders/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...data, operator_id: data.operatorId, comments: data.comments }),
  });
}
export async function deleteWorkOrder(id) {
  return fetchWithAuth(`${API_BASE}/workorders/${id}`, { method: "DELETE" });
}

// Users
export async function fetchUsers() {
  const res = await fetchWithAuth(`${API_BASE}/users/`);
  return res.users;
}
export async function createUser(data) {
  const payload = { ...data };
  if (payload.fullName) {
    payload.full_name = payload.fullName;
    delete payload.fullName;
  }
  // Do NOT rename password to password_hash!
  return fetchWithAuth(`${API_BASE}/users/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}
export async function updateUser(id, data) {
  const payload = { ...data };
  if (payload.fullName) {
    payload.full_name = payload.fullName;
    delete payload.fullName;
  }
  if (payload.password) {
    payload.password_hash = payload.password;
    delete payload.password;
  }
  return fetchWithAuth(`${API_BASE}/users/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}
export async function deleteUser(id) {
  return fetchWithAuth(`${API_BASE}/users/${id}`, { method: "DELETE" });
}

// Production Lines
export async function fetchProductionLines() {
  const res = await fetchWithAuth(`${API_BASE}/production-lines/`);
  return res.production_lines;
}
export async function createProductionLine(data) {
  return fetchWithAuth(`${API_BASE}/production-lines/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
}
export async function updateProductionLine(id, data) {
  return fetchWithAuth(`${API_BASE}/production-lines/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
}
export async function deleteProductionLine(id) {
  return fetchWithAuth(`${API_BASE}/production-lines/${id}`, { method: "DELETE" });
}

// Shifts
export async function fetchShifts() {
  const res = await fetchWithAuth(`${API_BASE}/shifts/`);
  return res.shifts;
}
export async function createShift(data) {
  return fetchWithAuth(`${API_BASE}/shifts/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
}
export async function updateShift(id, data) {
  return fetchWithAuth(`${API_BASE}/shifts/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
}
export async function deleteShift(id) {
  return fetchWithAuth(`${API_BASE}/shifts/${id}`, { method: "DELETE" });
}

// Stops
export async function fetchStops() {
  const res = await fetchWithAuth(`${API_BASE}/stops/`);
  return res.stops;
}
export async function createStop(data) {
  return fetchWithAuth(`${API_BASE}/stops/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
}
export async function updateStop(id, data) {
  return fetchWithAuth(`${API_BASE}/stops/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
}
export async function deleteStop(id) {
  return fetchWithAuth(`${API_BASE}/stops/${id}`, { method: "DELETE" });
}

// Alarms
export async function fetchAlarms() {
  return fetchWithAuth(`${API_BASE}/alarms/`);
}
export async function createAlarm(data) {
  return fetchWithAuth(`${API_BASE}/alarms/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
}
export async function updateAlarm(id, data) {
  return fetchWithAuth(`${API_BASE}/alarms/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
}
export async function deleteAlarm(id) {
  return fetchWithAuth(`${API_BASE}/alarms/${id}`, { method: "DELETE" });
}

// Events
export async function fetchEvents() {
  return fetchWithAuth(`${API_BASE}/events/`);
}
export async function createEvent(data) {
  return fetchWithAuth(`${API_BASE}/events/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
}
export async function updateEvent(id, data) {
  return fetchWithAuth(`${API_BASE}/events/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
}
export async function deleteEvent(id) {
  return fetchWithAuth(`${API_BASE}/events/${id}`, { method: "DELETE" });
}

export async function fetchOpenStop(machine_id) {
  const res = await fetchWithAuth(`${API_BASE}/stops/open?machine_id=${machine_id}`);
  return res.stop || null;
}

export async function fetchProducts() {
  const res = await fetchWithAuth(`${API_BASE}/products/`);
  return res.products;
}
export async function createProduct(data) {
  return fetchWithAuth(`${API_BASE}/products/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
}
export async function updateProduct(id, data) {
  return fetchWithAuth(`${API_BASE}/products/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
}
export async function deleteProduct(id) {
  return fetchWithAuth(`${API_BASE}/products/${id}`, { method: "DELETE" });
} 