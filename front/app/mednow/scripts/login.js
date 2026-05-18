import { jwtDecode } from "jwt-decode";

const API = "http://localhost:5000";

export async function login(username, password) {
  const res = await fetch(`${API}/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ username, password })
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || "Login failed");
  }


  if (!data.access_token || typeof data.access_token !== "string") {
    throw new Error("Token inválido recibido del backend");
  }

  const decoded = jwtDecode(data.access_token);

  return {
    token: data.access_token,
    role: data.role,
    dashboard: data.dashboard,
    user: decoded
  };
}