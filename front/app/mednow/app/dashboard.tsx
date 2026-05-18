import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Alert,
  ActivityIndicator,
  ScrollView,
} from 'react-native';

import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';

const API = 'http://localhost:5000';

// ----------------------
// TYPES
// ----------------------
type UserProfile = {
  _id: string;
  username: string;
  role: string;
  name?: string;
  last_name?: string;
  identification?: string;
  email?: string;
  blood_type?: string;
  rh?: string;
  phone?: string;
  height?: string;
};

type Doctor = {
  _id: string;
  username: string;
  name?: string;
  last_name?: string;
  specialty?: string;
};

type Schedule = {
  _id: string;
  doctor_id: string;
  date: string;
  time: string;
  available: boolean;
};

type Appointment = {
  _id: string;
  doctor_id: string;
  date?: string;
  time?: string;
  patient?: string;
};

// ----------------------
// FETCH HELPERS
// ----------------------
async function authFetch(url: string, token: string, options: any = {}) {
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...(options.headers || {}),
    },
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data.error || 'Request failed');
  }

  return data;
}

// ----------------------
// API CALLS
// ----------------------
async function getProfile(token: string): Promise<UserProfile> {
  const data = await authFetch(`${API}/profile`, token);
  // El backend retorna el objeto usuario directamente (sin wrapper "user")
  // pero en el código original era data.user — ajusta según tu backend:
  return data.user ?? data;
}

async function getDoctors(token: string): Promise<Doctor[]> {
  return await authFetch(`${API}/doctors`, token);
}

async function getAppointments(token: string): Promise<Appointment[]> {
  return await authFetch(`${API}/appointments`, token);
}

async function deleteAppointment(token: string, id: string) {
  return await authFetch(`${API}/appointment/${id}`, token, {
    method: 'DELETE',
  });
}

async function getSchedules(token: string, doctorId: string): Promise<Schedule[]> {
  return await authFetch(`${API}/schedule/${doctorId}`, token);
}

async function bookAppointment(token: string, scheduleId: string, patient: string) {
  return await authFetch(`${API}/appointments`, token, {
    method: 'POST',
    body: JSON.stringify({ schedule_id: scheduleId, patient }),
  });
}

// ----------------------
// COMPONENT
// ----------------------
export default function Dashboard() {
  const [token, setToken] = useState<string>('');

  // Datos
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);

  // Estados de visibilidad (acordeón)
  const [showProfile, setShowProfile] = useState(false);
  const [showDoctors, setShowDoctors] = useState(false);
  const [showAppointments, setShowAppointments] = useState(false);

  // Doctor seleccionado y sus horarios
  const [selectedDoctorId, setSelectedDoctorId] = useState<string | null>(null);
  const [schedules, setSchedules] = useState<Schedule[]>([]);

  // Loading states
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [loadingDoctors, setLoadingDoctors] = useState(false);
  const [loadingAppointments, setLoadingAppointments] = useState(false);
  const [loadingSchedules, setLoadingSchedules] = useState(false);
  const [loadingBook, setLoadingBook] = useState<string | null>(null);

  useEffect(() => {
    initToken();
  }, []);

  async function initToken() {
    try {
      const t = await AsyncStorage.getItem('token');
      if (!t) {
        Alert.alert('Error', 'No hay token guardado');
        return;
      }
      setToken(t);
      // Cargamos el perfil de inmediato para tener el username disponible
      const p = await getProfile(t);
      setProfile(p);
    } catch (err: any) {
      Alert.alert('Error', err.message);
    }
  }

  // ── Logout ────────────────────────────────────────────────
  async function handleLogout() {
    await AsyncStorage.removeItem('token');
    router.replace('/');
  }

  // ── Perfil ────────────────────────────────────────────────
  async function handleToggleProfile() {
    if (showProfile) {
      setShowProfile(false);
      return;
    }
    if (profile) {
      setShowProfile(true);
      return;
    }
    setLoadingProfile(true);
    try {
      const p = await getProfile(token);
      setProfile(p);
      setShowProfile(true);
    } catch (err: any) {
      Alert.alert('Error', err.message);
    } finally {
      setLoadingProfile(false);
    }
  }

  // ── Doctores ──────────────────────────────────────────────
  async function handleToggleDoctors() {
    if (showDoctors) {
      setShowDoctors(false);
      return;
    }
    if (doctors.length > 0) {
      setShowDoctors(true);
      return;
    }
    setLoadingDoctors(true);
    try {
      const d = await getDoctors(token);
      setDoctors(d);
      setShowDoctors(true);
    } catch (err: any) {
      Alert.alert('Error', err.message);
    } finally {
      setLoadingDoctors(false);
    }
  }

  // ── Citas ─────────────────────────────────────────────────
  async function handleToggleAppointments() {
    if (showAppointments) {
      setShowAppointments(false);
      return;
    }
    setLoadingAppointments(true);
    try {
      const a = await getAppointments(token);
      setAppointments(a);
      setShowAppointments(true);
    } catch (err: any) {
      Alert.alert('Error', err.message);
    } finally {
      setLoadingAppointments(false);
    }
  }

  // ── Horario de un doctor ──────────────────────────────────
  async function handleSelectDoctor(doctorId: string) {
    if (selectedDoctorId === doctorId) {
      setSelectedDoctorId(null);
      setSchedules([]);
      return;
    }
    setSelectedDoctorId(doctorId);
    setSchedules([]);
    setLoadingSchedules(true);
    try {
      const s = await getSchedules(token, doctorId);
      setSchedules(s);
    } catch (err: any) {
      Alert.alert('Error', err.message);
    } finally {
      setLoadingSchedules(false);
    }
  }

  // ── Reservar cita ─────────────────────────────────────────
  async function handleBookSchedule(schedule: Schedule) {
    if (!schedule.available) {
      Alert.alert('No disponible', 'Este horario ya no está disponible.');
      return;
    }
    const patient = profile?.username ?? 'anonymous';
    setLoadingBook(schedule._id);
    try {
      await bookAppointment(token, schedule._id, patient);
      Alert.alert('¡Cita agendada!', `${schedule.date} a las ${schedule.time}`);
      // Refrescar horarios y citas
      const [s, a] = await Promise.all([
        getSchedules(token, selectedDoctorId!),
        getAppointments(token),
      ]);
      setSchedules(s);
      setAppointments(a);
    } catch (err: any) {
      Alert.alert('Error', err.message);
    } finally {
      setLoadingBook(null);
    }
  }

  // ── Eliminar cita ─────────────────────────────────────────
  async function handleDelete(id: string) {
    try {
      await deleteAppointment(token, id);
      const a = await getAppointments(token);
      setAppointments(a);
    } catch (err: any) {
      Alert.alert('Error', err.message);
    }
  }

  // ─────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────
  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>

      {/* ── HEADER ── */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Mi Panel</Text>
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.8}>
          <Text style={styles.logoutText}>Salir</Text>
        </TouchableOpacity>
      </View>

      {/* ── PERFIL ── */}
      <TouchableOpacity style={styles.sectionBtn} onPress={handleToggleProfile} activeOpacity={0.8}>
        <Text style={styles.sectionBtnText}>👤  Perfil</Text>
        {loadingProfile
          ? <ActivityIndicator color="#38bdf8" />
          : <Text style={styles.chevron}>{showProfile ? '▲' : '▼'}</Text>
        }
      </TouchableOpacity>

      {showProfile && profile && (
        <View style={styles.card}>
          {profile.name       && <Row label="Nombre"         value={profile.name} />}
          {profile.last_name  && <Row label="Apellido"       value={profile.last_name} />}
          <Row label="Usuario"          value={profile.username} />
          <Row label="Rol"              value={profile.role} />
          {profile.email          && <Row label="Correo"         value={profile.email} />}
          {profile.identification && <Row label="Identificación" value={profile.identification} />}
          {profile.phone          && <Row label="Celular"        value={profile.phone} />}
          {profile.blood_type     && <Row label="Tipo de sangre" value={profile.blood_type} />}
          {profile.rh             && <Row label="RH"             value={profile.rh} />}
          {profile.height         && <Row label="Altura"         value={`${profile.height} cm`} />}
          <Row label="ID" value={profile._id} />
        </View>
      )}

      {/* ── DOCTORES ── */}
      <TouchableOpacity style={styles.sectionBtn} onPress={handleToggleDoctors} activeOpacity={0.8}>
        <Text style={styles.sectionBtnText}>🩺  Doctores</Text>
        {loadingDoctors
          ? <ActivityIndicator color="#38bdf8" />
          : <Text style={styles.chevron}>{showDoctors ? '▲' : '▼'}</Text>
        }
      </TouchableOpacity>

      {showDoctors && (
        <View>
          {doctors.length === 0
            ? <Text style={styles.empty}>Sin doctores registrados</Text>
            : doctors.map((doc) => (
              <View key={doc._id}>
                <TouchableOpacity
                  style={[
                    styles.card,
                    selectedDoctorId === doc._id && styles.cardSelected,
                  ]}
                  onPress={() => handleSelectDoctor(doc._id)}
                  activeOpacity={0.8}
                >
                  <View style={styles.rowBetween}>
                    <View>
                      <Text style={styles.doctorName}>
                        {doc.name && doc.last_name
                          ? `${doc.name} ${doc.last_name}`
                          : doc.name ?? doc.username}
                      </Text>
                      {doc.specialty && (
                        <Text style={styles.specialty}>{doc.specialty}</Text>
                      )}
                    </View>
                    <Text style={styles.chevronSmall}>
                      {selectedDoctorId === doc._id ? '▲' : '▼'}
                    </Text>
                  </View>
                </TouchableOpacity>

                {/* Horarios del doctor seleccionado */}
                {selectedDoctorId === doc._id && (
                  <View style={styles.scheduleContainer}>
                    {loadingSchedules
                      ? <ActivityIndicator color="#38bdf8" style={{ marginVertical: 10 }} />
                      : schedules.length === 0
                        ? <Text style={styles.empty}>Sin horarios disponibles</Text>
                        : schedules.map((sch) => (
                          <TouchableOpacity
                            key={sch._id}
                            style={[
                              styles.scheduleItem,
                              !sch.available && styles.scheduleUnavailable,
                            ]}
                            onPress={() => handleBookSchedule(sch)}
                            disabled={loadingBook === sch._id}
                            activeOpacity={0.75}
                          >
                            {loadingBook === sch._id
                              ? <ActivityIndicator color="#0f172a" />
                              : (
                                <View style={styles.rowBetween}>
                                  <Text style={styles.scheduleText}>
                                    📅 {sch.date}  🕐 {sch.time}
                                  </Text>
                                  <Text style={[
                                    styles.badge,
                                    sch.available ? styles.badgeAvail : styles.badgeTaken,
                                  ]}>
                                    {sch.available ? 'Disponible' : 'Ocupado'}
                                  </Text>
                                </View>
                              )}
                          </TouchableOpacity>
                        ))
                    }
                  </View>
                )}
              </View>
            ))
          }
        </View>
      )}

      {/* ── MIS CITAS ── */}
      <TouchableOpacity style={styles.sectionBtn} onPress={handleToggleAppointments} activeOpacity={0.8}>
        <Text style={styles.sectionBtnText}>📋  Mis citas</Text>
        {loadingAppointments
          ? <ActivityIndicator color="#38bdf8" />
          : <Text style={styles.chevron}>{showAppointments ? '▲' : '▼'}</Text>
        }
      </TouchableOpacity>

      {showAppointments && (
        <View>
          {appointments.length === 0
            ? <Text style={styles.empty}>No tienes citas agendadas</Text>
            : appointments.map((appt) => (
              <View key={appt._id} style={styles.cardRow}>
                <View>
                  <Text style={styles.text}>📅 {appt.date ?? 'sin fecha'}</Text>
                  <Text style={styles.textSub}>🕐 {appt.time ?? 'sin hora'}</Text>
                </View>
                <TouchableOpacity onPress={() => handleDelete(appt._id)}>
                  <Text style={styles.delete}>Eliminar</Text>
                </TouchableOpacity>
              </View>
            ))
          }
        </View>
      )}
    </ScrollView>
  );
}

// ── Subcomponente fila de perfil ──────────────────────────
function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.profileRow}>
      <Text style={styles.profileLabel}>{label}</Text>
      <Text style={styles.profileValue}>{value}</Text>
    </View>
  );
}

// ----------------------
// STYLES
// ----------------------
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
    padding: 16,
  },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
    marginTop: 8,
  },
  headerTitle: {
    color: '#e2e8f0',
    fontSize: 22,
    fontWeight: '800',
  },
  logoutBtn: {
    backgroundColor: '#7f1d1d',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  logoutText: {
    color: '#fca5a5',
    fontWeight: '700',
    fontSize: 13,
  },

  // Botones de sección (acordeón)
  sectionBtn: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginTop: 14,
    borderLeftWidth: 3,
    borderLeftColor: '#38bdf8',
  },
  sectionBtnText: {
    color: '#e2e8f0',
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  chevron: {
    color: '#38bdf8',
    fontSize: 14,
  },
  chevronSmall: {
    color: '#64748b',
    fontSize: 12,
  },

  // Cards genéricas
  card: {
    backgroundColor: '#1e293b',
    borderRadius: 10,
    padding: 14,
    marginTop: 6,
  },
  cardSelected: {
    borderColor: '#38bdf8',
    borderWidth: 1,
  },
  cardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    borderRadius: 10,
    padding: 14,
    marginTop: 6,
  },

  // Perfil
  profileRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  profileLabel: {
    color: '#94a3b8',
    fontSize: 13,
  },
  profileValue: {
    color: '#e2e8f0',
    fontSize: 13,
    fontWeight: '500',
    maxWidth: '65%',
    textAlign: 'right',
  },

  // Doctores
  doctorName: {
    color: '#e2e8f0',
    fontSize: 15,
    fontWeight: '600',
  },
  specialty: {
    color: '#38bdf8',
    fontSize: 12,
    marginTop: 2,
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  // Horarios
  scheduleContainer: {
    marginLeft: 12,
    marginBottom: 4,
  },
  scheduleItem: {
    backgroundColor: '#0ea5e9',
    borderRadius: 8,
    padding: 12,
    marginTop: 6,
  },
  scheduleUnavailable: {
    backgroundColor: '#334155',
  },
  scheduleText: {
    color: '#0f172a',
    fontWeight: '600',
    fontSize: 13,
    flex: 1,
  },
  badge: {
    fontSize: 11,
    fontWeight: '700',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
    overflow: 'hidden',
  },
  badgeAvail: {
    backgroundColor: '#dcfce7',
    color: '#166534',
  },
  badgeTaken: {
    backgroundColor: '#fee2e2',
    color: '#991b1b',
  },

  // Citas
  text: {
    color: '#e2e8f0',
    fontSize: 14,
  },
  textSub: {
    color: '#94a3b8',
    fontSize: 12,
    marginTop: 2,
  },
  delete: {
    color: '#ef4444',
    fontWeight: '600',
    fontSize: 13,
  },
  empty: {
    color: '#64748b',
    textAlign: 'center',
    paddingVertical: 12,
    fontSize: 13,
  },
});
