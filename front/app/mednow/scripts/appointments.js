import API from './api';

// -------------------------
// CREAR CITA
// -------------------------
export async function createAppointment(token, doctorId, scheduleId) {
  const res = await fetch(`${API}/appointments`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      doctor_id: doctorId,
      schedule_id: scheduleId,
    }),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || 'Error creating appointment');
  }

  return data;
}

// -------------------------
// VER CITAS
// -------------------------
export async function getAppointments(token) {
  if (!token) {
    throw new Error("No token provided");
  }

  const res = await fetch(`${API}/appointments`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || "Error getting appointments");
  }

  return data;
}

export async function deleteAppointment(token, id) {
  if (!token) throw new Error("No token");

  const res = await fetch(`http://localhost:5000/appointments/${id}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || "Error deleting appointment");
  }

  return data;
}