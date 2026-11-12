import { getAccessToken, logoutUser } from "./auth";

const API_BASE_URL = "http://127.0.0.1:8000";

async function adminRequest(endpoint, options = {}) {
  const token = getAccessToken();

  if (!token) {
    const error = new Error("Your session has expired. Please log in again.");
    error.status = 401;
    throw error;
  }

  let response;

  try {
    response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        ...(options.body ? { "Content-Type": "application/json" } : {}),
        Authorization: `Bearer ${token}`,
        ...options.headers,
      },
    });
  } catch {
    throw new Error(
      "Cannot connect to ISHARA AI. Please check that the backend is running."
    );
  }

  if (response.status === 401) {
    logoutUser();
    window.dispatchEvent(new Event("ishara:session-expired"));
  }

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const detail = data.detail;
    const message = Array.isArray(detail)
      ? detail.map((item) => item?.msg).filter(Boolean).join(" ")
      : typeof detail === "string"
        ? detail
        : response.status === 401
          ? "Your session has expired. Please log in again."
          : "Admin request failed. Please try again.";
    const error = new Error(message);
    error.status = response.status;
    throw error;
  }

  return data;
}

export function getAllUsers() {
  return adminRequest("/api/admin/users");
}

export function getUserById(userId) {
  return adminRequest(`/api/admin/users/${encodeURIComponent(userId)}`);
}

export function updateUser(userId, userData) {
  return adminRequest(`/api/admin/users/${encodeURIComponent(userId)}`, {
    method: "PUT",
    body: JSON.stringify(userData),
  });
}

export function updateUserStatus(userId, status) {
  return adminRequest(`/api/admin/users/${encodeURIComponent(userId)}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
}

export function deleteUser(userId) {
  return adminRequest(`/api/admin/users/${encodeURIComponent(userId)}`, {
    method: "DELETE",
  });
}
