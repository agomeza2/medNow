import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';

const API = 'http://localhost:5000';

// ----------------------
// TOAST HOOK
// ----------------------
function useToast() {
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const timerRef = useRef<any>(null);
  function showToast(message: string, type: 'success' | 'error' = 'success') {
    if (timerRef.current) clearTimeout(timerRef.current);
    setToast({ message, type });
    timerRef.current = setTimeout(() => setToast(null), 3500);
  }
  return { toast, showToast };
}

// ----------------------
// TYPES
// ----------------------
type User = {
  _id: string;
  username: string;
  name?: string;
  last_name?: string;
  role: string;
  email?: string;
  identification?: string;
  phone?: string;
  blood_type?: string;
  rh?: string;
  height?: string;
};

type HistoryRecord = {
  _id: string;
  patient_id: string;
  doctor_id: string;
  diagnosis: string;
  treatment: string;
  notes?: string;
  date?: string;
};

type ActiveView = 'home' | 'add_doctor' | 'users' | 'history';

// ----------------------
// FETCH HELPER
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
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}

// ----------------------
// API CALLS
// ----------------------
async function adminRegisterDoctor(payload: {
  username: string; name: string; last_name: string;
  password: string; email: string;
}) {
  const res = await fetch(`${API}/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...payload, role: 'doctor' }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Error al registrar');
  return data;
}

async function adminGetAllUsers(token: string): Promise<User[]> {
  return await authFetch(`${API}/users`, token);
}

async function adminGetAppointments(token: string) {
  return await authFetch(`${API}/appointments`, token);
}

async function adminGetHistory(token: string, patientId: string): Promise<HistoryRecord[]> {
  return await authFetch(`${API}/history/${patientId}`, token);
}

// ----------------------
// COMPONENT
// ----------------------
export default function AdminPanel() {
  const [token, setToken] = useState('');
  const [activeView, setActiveView] = useState<ActiveView>('home');
  const { toast, showToast } = useToast();

  // Agregar doctor
  const [docUsername, setDocUsername] = useState('');
  const [docName, setDocName] = useState('');
  const [docLastName, setDocLastName] = useState('');
  const [docPassword, setDocPassword] = useState('');
  const [docEmail, setDocEmail] = useState('');
  const [savingDoc, setSavingDoc] = useState(false);

  // Usuarios
  const [users, setUsers] = useState<User[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [expandedUser, setExpandedUser] = useState<string | null>(null);
  const [roleFilter, setRoleFilter] = useState<'all' | 'doctor' | 'patient'>('all');

  // Historiales
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loadingAppts, setLoadingAppts] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<string | null>(null);
  const [history, setHistory] = useState<HistoryRecord[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  useEffect(() => { init(); }, []);

  async function init() {
    const t = await AsyncStorage.getItem('token');
    if (!t) { router.replace('/'); return; }
    setToken(t);
  }

  async function handleLogout() {
    await AsyncStorage.removeItem('token');
    router.replace('/');
  }

  // ── Navegar ────────────────────────────────────────────────
  async function handleNav(view: ActiveView) {
    setActiveView(view);

    if (view === 'users' && users.length === 0) {
      setLoadingUsers(true);
      try {
        const u = await adminGetAllUsers(token);
        setUsers(u);
      } catch (err: any) {
        showToast(err.message, 'error');
      } finally {
        setLoadingUsers(false);
      }
    }

    if (view === 'history') {
      setLoadingAppts(true);
      try {
        // Cargamos todos los usuarios para tener la lista de pacientes real
        const u = await adminGetAllUsers(token);
        setUsers(u);
        const a = await adminGetAppointments(token);
        setAppointments(a);
      } catch (err: any) {
        showToast(err.message, 'error');
      } finally {
        setLoadingAppts(false);
      }
    }
  }

  // ── Agregar doctor ─────────────────────────────────────────
  async function handleAddDoctor() {
    if (!docUsername.trim() || !docName.trim() || !docLastName.trim() || !docPassword.trim()) {
      showToast('Usuario, nombre, apellido y contraseña son obligatorios', 'error');
      return;
    }
    setSavingDoc(true);
    try {
      await adminRegisterDoctor({
        username: docUsername.trim(),
        name: docName.trim(),
        last_name: docLastName.trim(),
        password: docPassword.trim(),
        email: docEmail.trim(),
      });
      showToast(`Dr. ${docName} ${docLastName} registrado`);
      setDocUsername(''); setDocName(''); setDocLastName('');
      setDocPassword(''); setDocEmail('');
      // refrescar lista si ya estaba cargada
      if (users.length > 0) {
        const u = await adminGetAllUsers(token);
        setUsers(u);
      }
    } catch (err: any) {
      showToast(err.message === 'exists' ? 'El usuario ya existe' : err.message, 'error');
    } finally {
      setSavingDoc(false);
    }
  }

  // ── Cargar historial de paciente ───────────────────────────
  async function handleSelectPatient(patientId: string) {
    if (selectedPatient === patientId) {
      setSelectedPatient(null);
      setHistory([]);
      return;
    }
    setSelectedPatient(patientId);
    setHistory([]);
    setLoadingHistory(true);
    try {
      const h = await adminGetHistory(token, patientId);
      setHistory(h);
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setLoadingHistory(false);
    }
  }

  // Pacientes únicos de los usuarios registrados
  const patientUsers = users.filter(u => u.role === 'patient');

  // ─────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.root}>

      {/* ── TOAST ── */}
      {toast && (
        <View style={[styles.toast, toast.type === 'error' ? styles.toastError : styles.toastSuccess]}>
          <Text style={styles.toastText}>{toast.message}</Text>
        </View>
      )}

      {/* ── SIDEBAR ── */}
      <View style={styles.sidebar}>
        <Text style={styles.logo}>Panel{'\n'}Admin</Text>
        <Text style={styles.sidebarSub}>Administrador</Text>

        <NavBtn label="🏠  Inicio"         active={activeView === 'home'}       onPress={() => handleNav('home')} />
        <NavBtn label="➕  Agregar doctor" active={activeView === 'add_doctor'} onPress={() => handleNav('add_doctor')} />
        <NavBtn label="👥  Usuarios"       active={activeView === 'users'}      onPress={() => handleNav('users')} />
        <NavBtn label="📋  Historiales"    active={activeView === 'history'}    onPress={() => handleNav('history')} />

        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.8}>
          <Text style={styles.logoutText}>🚪  Salir</Text>
        </TouchableOpacity>
      </View>

      {/* ── CONTENIDO ── */}
      <ScrollView style={styles.content} contentContainerStyle={{ paddingBottom: 40 }}>

        {/* HOME */}
        {activeView === 'home' && (
          <View>
            <Text style={styles.pageTitle}>Bienvenido</Text>
            <Text style={styles.pageSubtitle}>Panel de administración</Text>
            <View style={styles.statsRow}>
              <StatCard icon="👨‍⚕️" label="Doctores" value={users.filter(u => u.role === 'doctor').length || '—'} />
              <StatCard icon="📋" label="Pacientes" value={patientUsers.length || '—'} />
            </View>
            <View style={styles.infoCard}>
              <Text style={styles.infoText}>Selecciona una opción del menú para comenzar.</Text>
            </View>
          </View>
        )}

        {/* AGREGAR DOCTOR */}
        {activeView === 'add_doctor' && (
          <View>
            <Text style={styles.pageTitle}>Agregar doctor</Text>
            <Text style={styles.pageSubtitle}>Registra un nuevo médico en el sistema</Text>

            <View style={styles.formCard}>
              <Text style={styles.label}>Nombre <Text style={styles.required}>*</Text></Text>
              <TextInput style={styles.input} placeholder="Carlos" placeholderTextColor="#475569"
                value={docName} onChangeText={setDocName} />

              <Text style={styles.label}>Apellido <Text style={styles.required}>*</Text></Text>
              <TextInput style={styles.input} placeholder="Mendoza" placeholderTextColor="#475569"
                value={docLastName} onChangeText={setDocLastName} />

              <Text style={styles.label}>Usuario <Text style={styles.required}>*</Text></Text>
              <TextInput style={styles.input} placeholder="cmendoza" placeholderTextColor="#475569"
                value={docUsername} onChangeText={setDocUsername} autoCapitalize="none" />

              <Text style={styles.label}>Contraseña <Text style={styles.required}>*</Text></Text>
              <TextInput style={styles.input} placeholder="••••••••" placeholderTextColor="#475569"
                value={docPassword} onChangeText={setDocPassword} secureTextEntry />

              <Text style={styles.label}>Correo</Text>
              <TextInput style={styles.input} placeholder="cmendoza@hospital.com" placeholderTextColor="#475569"
                value={docEmail} onChangeText={setDocEmail} keyboardType="email-address" autoCapitalize="none" />

              <TouchableOpacity
                style={styles.primaryBtn}
                onPress={handleAddDoctor}
                disabled={savingDoc}
                activeOpacity={0.8}
              >
                {savingDoc
                  ? <ActivityIndicator color="white" />
                  : <Text style={styles.primaryBtnText}>Registrar doctor</Text>
                }
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* USUARIOS */}
        {activeView === 'users' && (
          <View>
            <Text style={styles.pageTitle}>Usuarios</Text>
            <Text style={styles.pageSubtitle}>Todos los médicos registrados</Text>

            {loadingUsers
              ? <ActivityIndicator color="#38bdf8" style={{ marginTop: 20 }} />
              : users.length === 0
                ? <Text style={styles.empty}>No hay usuarios registrados</Text>
                : users.map((user) => (
                  <View key={user._id}>
                    <TouchableOpacity
                      style={[styles.userCard, expandedUser === user._id && styles.userCardExpanded]}
                      onPress={() => setExpandedUser(expandedUser === user._id ? null : user._id)}
                      activeOpacity={0.8}
                    >
                      <View style={styles.rowBetween}>
                        <View style={styles.row}>
                          <View style={[styles.roleBadge, user.role === 'doctor' ? styles.roleDoctor : styles.rolePatient]}>
                            <Text style={styles.roleBadgeText}>{user.role === 'doctor' ? '👨‍⚕️' : '🧑'}</Text>
                          </View>
                          <View>
                            <Text style={styles.userName}>
                              {user.name && user.last_name ? `${user.name} ${user.last_name}` : user.username}
                            </Text>
                            <Text style={styles.userMeta}>@{user.username} · {user.role}</Text>
                          </View>
                        </View>
                        <Text style={styles.chevron}>{expandedUser === user._id ? '▲' : '▼'}</Text>
                      </View>
                    </TouchableOpacity>

                    {expandedUser === user._id && (
                      <View style={styles.userDetail}>
                        <DetailRow label="ID" value={user._id} />
                        {user.email        && <DetailRow label="Correo"         value={user.email} />}
                        {user.identification && <DetailRow label="Identificación" value={user.identification} />}
                        {user.phone        && <DetailRow label="Celular"        value={user.phone} />}
                        {user.blood_type   && <DetailRow label="Tipo de sangre" value={`${user.blood_type}${user.rh ?? ''}`} />}
                        {user.height       && <DetailRow label="Altura"         value={`${user.height} cm`} />}
                      </View>
                    )}
                  </View>
                ))
            }
          </View>
        )}

        {/* HISTORIALES */}
        {activeView === 'history' && (
          <View>
            <Text style={styles.pageTitle}>Historiales</Text>
            <Text style={styles.pageSubtitle}>Selecciona un paciente para ver su historial</Text>

            {loadingAppts
              ? <ActivityIndicator color="#38bdf8" style={{ marginTop: 20 }} />
              : patientUsers.length === 0
                ? <Text style={styles.empty}>No hay pacientes registrados</Text>
                : patientUsers.map((patient) => (
                  <View key={patient._id}>
                    <TouchableOpacity
                      style={[styles.patientCard, selectedPatient === patient.username && styles.patientCardActive]}
                      onPress={() => handleSelectPatient(patient.username)}
                      activeOpacity={0.8}
                    >
                      <View style={styles.rowBetween}>
                        <View>
                          <Text style={styles.patientName}>
                            👤 {patient.name && patient.last_name
                              ? `${patient.name} ${patient.last_name}`
                              : patient.username}
                          </Text>
                          <Text style={styles.userMeta}>@{patient.username}</Text>
                        </View>
                        <Text style={styles.chevron}>{selectedPatient === patient.username ? '▲' : '▼'}</Text>
                      </View>
                    </TouchableOpacity>

                    {selectedPatient === patient.username && (
                      <View style={styles.historyContainer}>
                        {loadingHistory
                          ? <ActivityIndicator color="#38bdf8" style={{ marginVertical: 10 }} />
                          : history.length === 0
                            ? <Text style={styles.empty}>Sin registros médicos</Text>
                            : history.map((record) => (
                              <View key={record._id} style={styles.historyCard}>
                                <Text style={styles.historyDate}>📅 {record.date ?? 'sin fecha'}</Text>
                                <DetailRow label="Diagnóstico" value={record.diagnosis} />
                                <DetailRow label="Tratamiento" value={record.treatment} />
                                {record.notes ? <DetailRow label="Notas" value={record.notes} /> : null}
                                <Text style={styles.historyDoctor}>Doctor ID: {record.doctor_id}</Text>
                              </View>
                            ))
                        }
                      </View>
                    )}
                  </View>
                ))
            }
          </View>
        )}

      </ScrollView>
    </SafeAreaView>
  );
}

// ── Subcomponentes ──────────────────────────────────────
function NavBtn({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <TouchableOpacity style={[styles.navBtn, active && styles.navBtnActive]} onPress={onPress} activeOpacity={0.8}>
      <Text style={[styles.navBtnText, active && styles.navBtnTextActive]}>{label}</Text>
    </TouchableOpacity>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  );
}

function StatCard({ icon, label, value }: { icon: string; label: string; value: any }) {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statIcon}>{icon}</Text>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

// ----------------------
// STYLES
// ----------------------
const styles = StyleSheet.create({
  root: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#020617',
  },

  // Toast
  toast: {
    position: 'absolute',
    top: 20,
    left: '30%',
    right: 20,
    zIndex: 999,
    borderRadius: 10,
    padding: 14,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  toastSuccess: { backgroundColor: '#14532d' },
  toastError:   { backgroundColor: '#7f1d1d' },
  toastText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },

  // Sidebar
  sidebar: {
    width: 220,
    backgroundColor: '#0f172a',
    padding: 20,
    paddingTop: 40,
    borderRightWidth: 1,
    borderRightColor: '#1e293b',
  },
  logo: {
    color: '#a78bfa',
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 4,
    lineHeight: 28,
  },
  sidebarSub: {
    color: '#64748b',
    fontSize: 12,
    marginBottom: 30,
  },
  navBtn: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 10,
    marginBottom: 6,
  },
  navBtnActive: {
    backgroundColor: '#2e1065',
    borderLeftWidth: 3,
    borderLeftColor: '#a78bfa',
  },
  navBtnText: {
    color: '#64748b',
    fontSize: 14,
    fontWeight: '500',
  },
  navBtnTextActive: {
    color: '#e2e8f0',
    fontWeight: '700',
  },
  logoutBtn: {
    marginTop: 30,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 10,
    backgroundColor: '#7f1d1d',
  },
  logoutText: {
    color: '#fca5a5',
    fontSize: 14,
    fontWeight: '700',
  },

  // Contenido
  content: {
    flex: 1,
    padding: 24,
    backgroundColor: '#020617',
  },
  pageTitle: {
    color: '#e2e8f0',
    fontSize: 28,
    fontWeight: '800',
    marginBottom: 4,
  },
  pageSubtitle: {
    color: '#64748b',
    fontSize: 14,
    marginBottom: 20,
  },

  // Stats
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#0f172a',
    borderRadius: 14,
    padding: 18,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  statIcon: { fontSize: 28, marginBottom: 6 },
  statValue: { color: '#a78bfa', fontSize: 26, fontWeight: '800' },
  statLabel: { color: '#64748b', fontSize: 12, marginTop: 2 },

  // Info card
  infoCard: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 16,
  },
  infoText: {
    color: '#94a3b8',
    fontSize: 14,
    lineHeight: 22,
  },

  // Formulario
  formCard: {
    backgroundColor: '#0f172a',
    borderRadius: 14,
    padding: 20,
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  label: {
    color: '#94a3b8',
    fontSize: 13,
    marginBottom: 6,
    marginTop: 14,
  },
  required: { color: '#ef4444' },
  input: {
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#334155',
    color: '#e2e8f0',
    padding: 14,
    borderRadius: 10,
    fontSize: 15,
  },
  primaryBtn: {
    backgroundColor: '#7c3aed',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 20,
  },
  primaryBtnText: {
    color: 'white',
    fontWeight: '700',
    fontSize: 15,
  },

  // Usuarios
  userCard: {
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: '#1e293b',
    borderRadius: 12,
    padding: 14,
    marginBottom: 6,
  },
  userCardExpanded: {
    borderColor: '#a78bfa',
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  roleBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  roleDoctor:  { backgroundColor: '#1e3a5f' },
  rolePatient: { backgroundColor: '#1e293b' },
  roleBadgeText: { fontSize: 18 },
  userName: {
    color: '#e2e8f0',
    fontWeight: '700',
    fontSize: 15,
  },
  userMeta: {
    color: '#64748b',
    fontSize: 12,
    marginTop: 2,
  },
  userDetail: {
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: '#a78bfa',
    borderTopWidth: 0,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
    padding: 14,
    marginBottom: 6,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 5,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
  },
  detailLabel: {
    color: '#64748b',
    fontSize: 12,
    fontWeight: '600',
  },
  detailValue: {
    color: '#e2e8f0',
    fontSize: 12,
    maxWidth: '65%',
    textAlign: 'right',
  },
  chevron: {
    color: '#64748b',
    fontSize: 12,
  },

  // Historial
  patientCard: {
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: '#1e293b',
    borderRadius: 12,
    padding: 14,
    marginBottom: 6,
  },
  patientCardActive: {
    borderColor: '#a78bfa',
  },
  patientName: {
    color: '#e2e8f0',
    fontWeight: '700',
    fontSize: 15,
  },
  historyContainer: {
    marginLeft: 12,
    marginBottom: 8,
  },
  historyCard: {
    backgroundColor: '#1e293b',
    borderRadius: 10,
    padding: 14,
    marginBottom: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#a78bfa',
  },
  historyDate: {
    color: '#a78bfa',
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 8,
  },
  historyDoctor: {
    color: '#475569',
    fontSize: 11,
    marginTop: 6,
  },
  empty: {
    color: '#475569',
    textAlign: 'center',
    marginTop: 30,
    fontSize: 14,
  },
});
