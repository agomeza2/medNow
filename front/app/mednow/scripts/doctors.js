import API from './api';

export async function getDoctors(token) {
  const res = await fetch(`${API}/doctors`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await res.json();

  if (!res.ok) throw new Error(data.error || 'Error getting doctors');

  return data;
}