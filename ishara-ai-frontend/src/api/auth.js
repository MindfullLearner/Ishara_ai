
const API_BASE_URL = "http://127.0.0.1:8000";

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
    throw new Error(
      data.detail || "The request failed. Please try again."
    );
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

export function loginUser({ username, sequence }) {
  return sendAuthRequest("/api/auth/login", {
    username,
    sequence,
  });
}
