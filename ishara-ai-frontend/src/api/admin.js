
import { getAccessToken, logoutUser } from "./auth";

const API_BASE_URL = "http://127.0.0.1:8000";

async function adminRequest(endpoint, options = {}) {
  const token = getAccessToken();

  if (!token) {
    throw new Error("Your session has expired. Please log in again.");
  }

  let response;

  try {
    response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        ...options.headers,
      },
    });
  } catch {
    throw new Error(
      "Cannot connect to ISHARA AI. Please check that the backend is running."
    );
  }

  const data = await response.json().catch(() => ({}));

  if (response.status === 401) {
    logoutUser();
    throw new Error("Your session has expired. Please log in again.");
  }

  if (!response.ok) {
    const error = new Error(
      data.detail || "Admin request failed. Please try again."
    );

    error.status = response.status;
    throw error;
  }

  return data;
}

export function getAllUsers() {
  return adminRequest("/api/admin/users");
}

export function getUserById(userId) {
  return adminRequest(`/api/admin/users/${userId}`);
}

export function updateUser(userId, userData) {
  return adminRequest(`/api/admin/users/${userId}`, {
    method: "PUT",
    body: JSON.stringify(userData),
  });
}

export function updateUserStatus(userId, status) {
  return adminRequest(`/api/admin/users/${userId}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
}

export function deleteUser(userId) {
  return adminRequest(`/api/admin/users/${userId}`, {
    method: "DELETE",
  });
}