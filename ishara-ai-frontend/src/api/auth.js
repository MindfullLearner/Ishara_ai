
const API_BASE_URL = "http://127.0.0.1:8000";
const TOKEN_KEY = "ishara_access_token";

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
    const error = new Error(
      data.detail || "The request failed. Please try again."
    );

    error.status = response.status;
    throw error;
  }

  return data;
}

export function signupUser({ username, email, sequence }) {
  return sendAuthRequest("/api/auth/signup", {
    username,
    email,
    sequence,
  });
}

export async function loginUser({ username, sequence }) {
  const data = await sendAuthRequest("/api/auth/login", {
    username,
    sequence,
  });

  if (data.access_token) {
    sessionStorage.setItem(TOKEN_KEY, data.access_token);
  }

  return data;
}

export function getAccessToken() {
  return sessionStorage.getItem(TOKEN_KEY);
}

export function logoutUser() {
  sessionStorage.removeItem(TOKEN_KEY);
}

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

    const error = new Error(
      data.detail || "Unable to verify your session."
    );

    error.status = response.status;
    throw error;
  }

  return data;
}
