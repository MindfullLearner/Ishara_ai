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

  if (response.status === 204) {
    return null;
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

export function getDashboardSummary() {
  return adminRequest("/api/admin/dashboard/summary");
}
export function getSystemLogs(limit = 500) {
  return adminRequest(
    `/api/admin/system-logs?limit=${encodeURIComponent(limit)}`
  );
}

export function createUser(userData) {
  return adminRequest("/api/admin/users", {
    method: "POST",
    body: JSON.stringify(userData),
  });
}
// PSL Dictionary API

export function getAllPSLSigns() {
  return adminRequest("/api/admin/psl-dictionary");
}

export function getPSLSignById(signId) {
  return adminRequest(`/api/admin/psl-dictionary/${encodeURIComponent(signId)}`);
}

export function createPSLSign(signData) {
  return adminRequest("/api/admin/psl-dictionary", {
    method: "POST",
    body: JSON.stringify(signData),
  });
}

export function updatePSLSign(signId, signData) {
  return adminRequest(`/api/admin/psl-dictionary/${encodeURIComponent(signId)}`, {
    method: "PUT",
    body: JSON.stringify(signData),
  });
}

export function deletePSLSign(signId) {
  return adminRequest(`/api/admin/psl-dictionary/${encodeURIComponent(signId)}`, {
    method: "DELETE",
  });
}

export async function uploadPSLSignMedia(signId, file, mediaType) {
  const token = getAccessToken();

  if (!token) {
    const error = new Error("Your session has expired. Please log in again.");
    error.status = 401;
    throw error;
  }

  const formData = new FormData();
  formData.append("file", file);

  let response;

  try {
    response = await fetch(
      `${API_BASE_URL}/api/admin/psl-dictionary/${encodeURIComponent(signId)}/media?media_type=${encodeURIComponent(mediaType)}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      }
    );
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
        : "Media upload failed. Please try again.";

    const error = new Error(message);
    error.status = response.status;
    throw error;
  }

  return data;
}

// Knowledge Base API

export function getAllKnowledgeArticles() {
  return adminRequest("/api/admin/knowledge-base");
}

export function getKnowledgeArticleById(articleId) {
  return adminRequest(
    `/api/admin/knowledge-base/${encodeURIComponent(articleId)}`
  );
}

export function createKnowledgeArticle(articleData) {
  return adminRequest("/api/admin/knowledge-base", {
    method: "POST",
    body: JSON.stringify(articleData),
  });
}

export function updateKnowledgeArticle(articleId, articleData) {
  return adminRequest(
    `/api/admin/knowledge-base/${encodeURIComponent(articleId)}`,
    {
      method: "PUT",
      body: JSON.stringify(articleData),
    }
  );
}

export function deleteKnowledgeArticle(articleId) {
  return adminRequest(
    `/api/admin/knowledge-base/${encodeURIComponent(articleId)}`,
    {
      method: "DELETE",
    }
  );
}
// ==============================
// Processing Activity API
// ==============================

export function getAllProcessingActivities() {
  return adminRequest("/api/admin/processing-activity");
}

export function getProcessingActivityById(activityId) {
  return adminRequest(
    `/api/admin/processing-activity/${encodeURIComponent(activityId)}`
  );
}

export function updateProcessingActivity(activityId, activityData) {
  return adminRequest(
    `/api/admin/processing-activity/${encodeURIComponent(activityId)}`,
    {
      method: "PATCH",
      body: JSON.stringify(activityData),
    }
  );
}


