import API from './api';

export async function getProfile(token) {
  const res = await fetch(`${API}/profile`, {
    method: "GET",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json"
    }
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || "unauthorized");
  }

  return data; // ✔ directo, NO data.user
}