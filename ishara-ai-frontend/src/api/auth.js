
const API_BASE_URL = "http://127.0.0.1:8000";
const TOKEN_KEY = "ishara_access_token";

function getApiErrorMessage(detail, fallback) {
  if (typeof detail === "string" && detail.trim()) return detail;

  if (Array.isArray(detail)) {
    const messages = detail.map((item) => {
      if (typeof item === "string") return item;
      if (!item || typeof item !== "object" || typeof item.msg !== "string") {
        return "";
      }

      const location = Array.isArray(item.loc)
        ? item.loc.filter((part) => part !== "body").join(" → ")
        : "";
      return location ? `${location}: ${item.msg}` : item.msg;
    }).filter(Boolean);

    if (messages.length) return messages.join(" ");
  }

  if (detail && typeof detail === "object" && typeof detail.message === "string") {
    return detail.message;
  }

  return fallback;
}

function makeApiError(response, data, fallback) {
  const error = new Error(getApiErrorMessage(data.detail, fallback));
  error.status = response.status;
  return error;
}

async function sendAuthRequest(endpoint, payload) {
  let response;

  try {
    response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
  } catch {
    throw new Error(
      "Cannot connect to ISHARA AI. Please check that the backend is running."
    );
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw makeApiError(response, data, "The request failed. Please try again.");
  }

  return data;
}

// Create a new account
export function signupUser({ full_name, email, password }) {
  return sendAuthRequest("/api/auth/signup", {
    full_name,
    email,
    password,
  });
}

// Verify email using the token from the email link
export function verifyEmail(token) {
  return sendAuthRequest("/api/auth/verify-email", {
    token,
  });
}

// Login with email and password
export async function loginUser({ email, password }) {
  const data = await sendAuthRequest("/api/auth/login", {
    email,
    password,
  });

  if (data.access_token) {
    sessionStorage.setItem(TOKEN_KEY, data.access_token);
  }

  return data;
}

// Request password reset email
export function forgotPassword(email) {
  return sendAuthRequest("/api/auth/forgot-password", {
    email,
  });
}

// Set a new password using reset token
export function resetPassword({ token, new_password }) {
  return sendAuthRequest("/api/auth/reset-password", {
    token,
    new_password,
  });
}

export function getAccessToken() {
  return sessionStorage.getItem(TOKEN_KEY);
}

export function logoutUser() {
  sessionStorage.removeItem(TOKEN_KEY);
}

// Get currently authenticated user
export async function getCurrentUser() {
  const token = getAccessToken();

  if (!token) {
    return null;
  }

  let response;

  try {
    response = await fetch(`${API_BASE_URL}/api/auth/me`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  } catch {
    throw new Error(
      "Cannot connect to ISHARA AI. Please check that the backend is running."
    );
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    if (response.status === 401) {
      logoutUser();
      return null;
    }

    throw makeApiError(response, data, "Unable to verify your session.");
  }

  return data;
}

export async function updateCurrentUserProfile(profileData) {
  const token = getAccessToken();

  const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(profileData),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw makeApiError(
      response,
      data,
      "Unable to update profile."
    );
  }

  return data;
}

export async function changeCurrentUserPassword(passwordData) {
  const token = getAccessToken();

  const response = await fetch(`${API_BASE_URL}/api/auth/me/password`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(passwordData),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw makeApiError(
      response,
      data,
      "Unable to change password."
    );
  }

  return data;
}
