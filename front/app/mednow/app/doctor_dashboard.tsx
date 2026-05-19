import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Calendar } from 'react-native-calendars';
import { router } from 'expo-router';

const API = 'http://localhost:5000';

// Slots de 07:00 a 20:00 en intervalos de 1 hora
const TIME_SLOTS = Array.from({ length: 14 }, (_, i) => {
  const hour = 7 + i;
  return `${String(hour).padStart(2, '0')}:00`;
});

// ----------------------
// TYPES
// ----------------------
type UserProfile = {
  _id: string;
  username: string;
  name?: string;
  last_name?: string;
  role: string;
};

type Appointment = {
  status: string;
  _id: string;
  doctor_id: string;
  patient: string;
  date?: string;
  time?: string;
};

type MedicalHistory = {
  _id: string;
  patient_id: string;
  doctor_id: string;
  diagnosis: string;
  treatment: string;
  notes?: string;
  date?: string;
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
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}

// ----------------------
// API CALLS
// ----------------------
async function doctorGetProfile(token: string): Promise<UserProfile> {
  const data = await authFetch(`${API}/profile`, token);
  return data.user ?? data;
}

async function doctorGetAppointments(token: string, doctorId: string): Promise<Appointment[]> {
  const all = await authFetch(`${API}/appointments`, token);
  return all.filter((a: Appointment) => a.doctor_id === doctorId && a.status !== 'completed');
}

async function doctorCreateSchedule(token: string, doctorId: string, date: string, time: string) {
  return await authFetch(`${API}/schedule/${doctorId}`, token, {
    method: 'POST',
    body: JSON.stringify({ date, time }),
  });
}

async function doctorCreateHistory(token: string, payload: Omit<MedicalHistory, '_id'>) {
  return await authFetch(`${API}/history`, token, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

async function doctorGetHistory(token: string, patientId: string): Promise<MedicalHistory[]> {
  return await authFetch(`${API}/history/${patientId}`, token);
}

async function doctorFinishAppointment(token: string, id: string) {
  return await authFetch(`${API}/appointment/${id}`, token, {
    method: 'DELETE',
  });
}
async function deleteAppointment(token: string, id: string) {
  return await authFetch(`${API}/appointment/${id}`, token, {
    method: 'DELETE',
  });
}

// ----------------------
// VIEWS ENUM
// ----------------------
type ActiveView = 'home' | 'schedule' | 'appointments' | 'history';

// ----------------------
// COMPONENT
// ----------------------
export default function DoctorDashboard() {
  const [token, setToken] = useState('');
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [activeView, setActiveView] = useState<ActiveView>('home');

  // Horarios — calendario
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedSlots, setSelectedSlots] = useState<string[]>([]);
  const [savingSlots, setSavingSlots] = useState(false);

  // Citas
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loadingAppts, setLoadingAppts] = useState(false);
  const [selectedAppt, setSelectedAppt] = useState<Appointment | null>(null);

  // Historial médico — form
  const [histDiagnosis, setHistDiagnosis] = useState('');
  const [histTreatment, setHistTreatment] = useState('');
  const [histNotes, setHistNotes] = useState('');
  const [loadingHist, setLoadingHist] = useState(false);

  // Historial médico — ver registros del paciente
  const [patientHistory, setPatientHistory] = useState<MedicalHistory[]>([]);
  const [showPatientHistory, setShowPatientHistory] = useState(false);
  const [loadingPatientHistory, setLoadingPatientHistory] = useState(false);

  // Terminar cita
  const [finishingAppt, setFinishingAppt] = useState(false);

  useEffect(() => { init(); }, []);

  async function init() {
    try {
      const t = await AsyncStorage.getItem('token');
      if (!t) { Alert.alert('Error', 'No hay token guardado'); return; }
      setToken(t);
      const p = await doctorGetProfile(t);
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

  // ── Cambiar vista ──────────────────────────────────────────
  async function handleNav(view: ActiveView) {
    setActiveView(view);

    if (view === 'appointments' && profile) {
      setSelectedAppt(null);
      setLoadingAppts(true);
      try {
        const a = await doctorGetAppointments(token, profile._id);
        setAppointments(a);
      } catch (err: any) {
        Alert.alert('Error', err.message);
      } finally {
        setLoadingAppts(false);
      }
    }
  }

  // ── Seleccionar día en calendario ─────────────────────────
  function handleDayPress(day: { dateString: string }) {
    setSelectedDate(day.dateString);
    setSelectedSlots([]);
  }

  // ── Toggle slot de hora ───────────────────────────────────
  function toggleSlot(slot: string) {
    setSelectedSlots((prev) =>
      prev.includes(slot) ? prev.filter((s) => s !== slot) : [...prev, slot]
    );
  }

  // ── Guardar todos los slots seleccionados ─────────────────
  async function handleSaveSlots() {
    if (!selectedDate) {
      Alert.alert('Error', 'Selecciona un día en el calendario');
      return;
    }
    if (selectedSlots.length === 0) {
      Alert.alert('Error', 'Selecciona al menos un horario');
      return;
    }
    setSavingSlots(true);
    try {
      await Promise.all(
        selectedSlots.map((slot) =>
          doctorCreateSchedule(token, profile!._id, selectedDate, slot)
        )
      );
      Alert.alert(
        '✅ Horarios guardados',
        `${selectedSlots.length} horario(s) para el ${selectedDate}`
      );
      setSelectedSlots([]);
    } catch (err: any) {
      Alert.alert('Error', err.message);
    } finally {
      setSavingSlots(false);
    }
  }

  // ── Guardar historial ──────────────────────────────────────
  async function handleSaveHistory() {
    if (!selectedAppt) {
      Alert.alert('Error', 'Selecciona un paciente primero');
      return;
    }
    if (!histDiagnosis.trim() || !histTreatment.trim()) {
      Alert.alert('Error', 'Diagnóstico y tratamiento son obligatorios');
      return;
    }
    setLoadingHist(true);
    try {
      await doctorCreateHistory(token, {
        patient_id: selectedAppt.patient,
        doctor_id: profile!._id,
        diagnosis: histDiagnosis.trim(),
        treatment: histTreatment.trim(),
        notes: histNotes.trim(),
        date: new Date().toISOString().split('T')[0],
      });
      Alert.alert('✅ Historial guardado', `Paciente: ${selectedAppt.patient}`);
      setHistDiagnosis('');
      setHistTreatment('');
      setHistNotes('');
      setSelectedAppt(null);
      setPatientHistory([]);
      setShowPatientHistory(false);
    } catch (err: any) {
      Alert.alert('Error', err.message);
    } finally {
      setLoadingHist(false);
    }
  }

  // ── Ver historial del paciente ────────────────────────────
  async function handleTogglePatientHistory() {
    if (showPatientHistory) {
      setShowPatientHistory(false);
      return;
    }
    if (!selectedAppt) {
      Alert.alert('Error', 'Selecciona una cita primero');
      return;
    }
    setLoadingPatientHistory(true);
    try {
      const h = await doctorGetHistory(token, selectedAppt.patient);
      setPatientHistory(h);
      setShowPatientHistory(true);
    } catch (err: any) {
      Alert.alert('Error', err.message);
    } finally {
      setLoadingPatientHistory(false);
    }
  }

  // ── Terminar cita ─────────────────────────────────────────
  async function handleFinishAppointment() {
    if (!selectedAppt) {
      Alert.alert('Error', 'No hay cita seleccionada');
      return;
    }
    const apptToFinish = selectedAppt; // capturar antes del Alert
    Alert.alert(
      'Terminar cita',
      `¿Confirmas que la cita con ${apptToFinish.patient} ha finalizado?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Terminar',
          style: 'destructive',
          onPress: async () => {
            setFinishingAppt(true);
            try {
              console.log('Terminando cita:', apptToFinish._id);
              await doctorFinishAppointment(token, apptToFinish._id);
              console.log('Cita terminada OK');
              setSelectedAppt(null);
              setPatientHistory([]);
              setShowPatientHistory(false);
              const a = await doctorGetAppointments(token, profile!._id);
              setAppointments(a);
              setActiveView('appointments');
              Alert.alert('✅ Cita finalizada', `Paciente: ${apptToFinish.patient}`);
            } catch (err: any) {
              console.log('Error terminando cita:', err.message);
              Alert.alert('Error', err.message);
            } finally {
              setFinishingAppt(false);
            }
          },
        },
      ]
    );
  }

  const doctorName = profile
    ? profile.name && profile.last_name
      ? `${profile.name} ${profile.last_name}`
      : profile.username
    : '...';

  const today = new Date().toISOString().split('T')[0];

  // ─────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.root}>

      {/* ── SIDEBAR ── */}
      <View style={styles.sidebar}>
        <Text style={styles.logo}>Panel{'\n'}Médico</Text>
        <Text style={styles.sidebarDoctor}>{doctorName}</Text>

        <NavBtn label="🏠  Inicio"       active={activeView === 'home'}         onPress={() => handleNav('home')} />
        <NavBtn label="🗓  Mis horarios"  active={activeView === 'schedule'}     onPress={() => handleNav('schedule')} />
        <NavBtn label="👥  Mis citas"    active={activeView === 'appointments'} onPress={() => handleNav('appointments')} />
        <NavBtn label="📋  Historial"    active={activeView === 'history'}      onPress={() => handleNav('history')} />

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
            <Text style={styles.pageSubtitle}>Dr. {doctorName}</Text>
            <View style={styles.infoCard}>
              <Text style={styles.infoText}>
                Selecciona una opción del menú lateral para comenzar.
              </Text>
            </View>
          </View>
        )}

        {/* ── HORARIOS ── */}
        {activeView === 'schedule' && (
          <View>
            <Text style={styles.pageTitle}>Agregar horarios</Text>
            <Text style={styles.pageSubtitle}>Selecciona el día y marca los horarios disponibles</Text>

            <Calendar
              style={styles.calendar}
              minDate={today}
              onDayPress={handleDayPress}
              markedDates={
                selectedDate
                  ? { [selectedDate]: { selected: true, selectedColor: '#2563eb' } }
                  : {}
              }
              theme={{
                backgroundColor: '#0f172a',
                calendarBackground: '#0f172a',
                textSectionTitleColor: '#64748b',
                selectedDayBackgroundColor: '#2563eb',
                selectedDayTextColor: '#ffffff',
                todayTextColor: '#38bdf8',
                dayTextColor: '#e2e8f0',
                textDisabledColor: '#334155',
                arrowColor: '#38bdf8',
                monthTextColor: '#e2e8f0',
                textMonthFontWeight: '700',
                textDayFontSize: 14,
                textMonthFontSize: 16,
              }}
            />

            {selectedDate ? (
              <View style={styles.slotsSection}>
                <Text style={styles.slotsTitle}>
                  Horarios para <Text style={styles.slotsDate}>{selectedDate}</Text>
                </Text>
                <Text style={styles.slotsHint}>Toca para seleccionar / deseleccionar</Text>

                <View style={styles.slotsGrid}>
                  {TIME_SLOTS.map((slot) => {
                    const active = selectedSlots.includes(slot);
                    return (
                      <TouchableOpacity
                        key={slot}
                        style={[styles.slotBtn, active && styles.slotBtnActive]}
                        onPress={() => toggleSlot(slot)}
                        activeOpacity={0.75}
                      >
                        <Text style={[styles.slotText, active && styles.slotTextActive]}>
                          {slot}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {selectedSlots.length > 0 && (
                  <TouchableOpacity
                    style={styles.primaryBtn}
                    onPress={handleSaveSlots}
                    disabled={savingSlots}
                    activeOpacity={0.8}
                  >
                    {savingSlots
                      ? <ActivityIndicator color="white" />
                      : <Text style={styles.primaryBtnText}>
                          Guardar {selectedSlots.length} horario(s)
                        </Text>
                    }
                  </TouchableOpacity>
                )}
              </View>
            ) : (
              <View style={styles.infoCard}>
                <Text style={styles.infoText}>
                  📅 Toca un día en el calendario para ver los horarios disponibles.
                </Text>
              </View>
            )}
          </View>
        )}

        {/* ── CITAS ── */}
        {activeView === 'appointments' && (
          <View>
            <Text style={styles.pageTitle}>Mis citas</Text>
            <Text style={styles.pageSubtitle}>Pacientes agendados</Text>

            {loadingAppts
              ? <ActivityIndicator color="#38bdf8" style={{ marginTop: 20 }} />
              : appointments.length === 0
                ? <Text style={styles.empty}>No tienes citas agendadas</Text>
                : appointments.map((appt) => (
                  <View key={appt._id} style={styles.apptCard}>
                    <View style={styles.rowBetween}>
                      <View>
                        <Text style={styles.patientName}>👤 {appt.patient}</Text>
                        <Text style={styles.apptMeta}>
                          📅 {appt.date ?? 'sin fecha'}  🕐 {appt.time ?? 'sin hora'}
                        </Text>
                      </View>
                      <TouchableOpacity
                        onPress={() => {
                          setSelectedAppt(appt);
                          handleNav('history');
                        }}
                        activeOpacity={0.8}
                      >
                        <Text style={styles.arrowHint}>Ver historial →</Text>
                      </TouchableOpacity>
                    </View>
                    <TouchableOpacity
                      style={styles.finishBtnInline}
                      onPress={async () => {
                        const apptToFinish = appt;
                        try {
                                  await doctorFinishAppointment(token, apptToFinish._id);
                                  const a = await doctorGetAppointments(token, profile!._id);
                                  setAppointments(a);
                                  //Alert.alert('Cita finalizada', `Paciente: ${apptToFinish.patient}`);
                                } catch (err: any) {
                                  Alert.alert('Error', err.message);
                                } finally {
                                  setFinishingAppt(false);
                                }
                      }}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.finishBtnInlineText}>✅ Terminar cita</Text>
                    </TouchableOpacity>
                  </View>
                ))
            }
          </View>
        )}

        {/* ── HISTORIAL ── */}
        {activeView === 'history' && (
          <View>
            <Text style={styles.pageTitle}>Historial médico</Text>

            {selectedAppt ? (
              <View style={styles.patientBadge}>
                <Text style={styles.patientBadgeLabel}>PACIENTE</Text>
                <Text style={styles.patientBadgeName}>{selectedAppt.patient}</Text>
                <Text style={styles.patientBadgeMeta}>
                  {selectedAppt.date} · {selectedAppt.time}
                </Text>
              </View>
            ) : (
              <View style={styles.infoCard}>
                <Text style={styles.infoText}>
                  ⚠️ Ve a <Text style={styles.bold}>Mis citas</Text> y toca una cita para seleccionar el paciente.
                </Text>
              </View>
            )}

            <View style={styles.formCard}>
              <Text style={styles.label}>Diagnóstico <Text style={styles.required}>*</Text></Text>
              <TextInput
                style={[styles.input, styles.inputMulti]}
                placeholder="Describe el diagnóstico"
                placeholderTextColor="#475569"
                value={histDiagnosis}
                onChangeText={setHistDiagnosis}
                multiline
                numberOfLines={3}
              />

              <Text style={styles.label}>Tratamiento <Text style={styles.required}>*</Text></Text>
              <TextInput
                style={[styles.input, styles.inputMulti]}
                placeholder="Describe el tratamiento"
                placeholderTextColor="#475569"
                value={histTreatment}
                onChangeText={setHistTreatment}
                multiline
                numberOfLines={3}
              />

              <Text style={styles.label}>Notas adicionales</Text>
              <TextInput
                style={[styles.input, styles.inputMulti]}
                placeholder="Observaciones, alergias, etc."
                placeholderTextColor="#475569"
                value={histNotes}
                onChangeText={setHistNotes}
                multiline
                numberOfLines={2}
              />

              <TouchableOpacity
                style={[styles.primaryBtn, !selectedAppt && styles.primaryBtnDisabled]}
                onPress={handleSaveHistory}
                disabled={loadingHist || !selectedAppt}
                activeOpacity={0.8}
              >
                {loadingHist
                  ? <ActivityIndicator color="white" />
                  : <Text style={styles.primaryBtnText}>Guardar historial</Text>
                }
              </TouchableOpacity>
            </View>

            {/* Ver historial previo del paciente */}
            {selectedAppt && (
              <View style={{ marginTop: 20 }}>
                <TouchableOpacity
                  style={styles.secondaryBtn}
                  onPress={handleTogglePatientHistory}
                  disabled={loadingPatientHistory}
                  activeOpacity={0.8}
                >
                  {loadingPatientHistory
                    ? <ActivityIndicator color="#38bdf8" />
                    : <Text style={styles.secondaryBtnText}>
                        {showPatientHistory ? '▲  Ocultar historial previo' : '📂  Ver historial previo del paciente'}
                      </Text>
                  }
                </TouchableOpacity>

                {showPatientHistory && (
                  <View style={{ marginTop: 10 }}>
                    {patientHistory.length === 0
                      ? <Text style={styles.empty}>Sin registros previos</Text>
                      : patientHistory.map((record) => (
                        <View key={record._id} style={styles.historyCard}>
                          <Text style={styles.historyDate}>📅 {record.date ?? 'sin fecha'}</Text>
                          <View style={styles.historyRow}>
                            <Text style={styles.historyLabel}>Diagnóstico</Text>
                            <Text style={styles.historyValue}>{record.diagnosis}</Text>
                          </View>
                          <View style={styles.historyRow}>
                            <Text style={styles.historyLabel}>Tratamiento</Text>
                            <Text style={styles.historyValue}>{record.treatment}</Text>
                          </View>
                          {record.notes ? (
                            <View style={styles.historyRow}>
                              <Text style={styles.historyLabel}>Notas</Text>
                              <Text style={styles.historyValue}>{record.notes}</Text>
                            </View>
                          ) : null}
                        </View>
                      ))
                    }
                  </View>
                )}
              </View>
            )}
          </View>
        )}

      </ScrollView>
    </SafeAreaView>
  );
}

// ── Subcomponente botón de navegación ─────────────────────
function NavBtn({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <TouchableOpacity
      style={[styles.navBtn, active && styles.navBtnActive]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <Text style={[styles.navBtnText, active && styles.navBtnTextActive]}>{label}</Text>
    </TouchableOpacity>
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
  sidebar: {
    width: 220,
    backgroundColor: '#0f172a',
    padding: 20,
    paddingTop: 40,
    borderRightWidth: 1,
    borderRightColor: '#1e293b',
  },
  logo: {
    color: '#38bdf8',
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 6,
    lineHeight: 28,
  },
  sidebarDoctor: {
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
    backgroundColor: '#1e3a5f',
    borderLeftWidth: 3,
    borderLeftColor: '#38bdf8',
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
  infoCard: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 16,
    marginTop: 12,
  },
  infoText: {
    color: '#94a3b8',
    fontSize: 14,
    lineHeight: 22,
  },
  calendar: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 4,
  },
  slotsSection: {
    marginTop: 20,
  },
  slotsTitle: {
    color: '#e2e8f0',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  slotsDate: {
    color: '#38bdf8',
  },
  slotsHint: {
    color: '#475569',
    fontSize: 12,
    marginBottom: 14,
  },
  slotsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  slotBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#334155',
    backgroundColor: '#0f172a',
  },
  slotBtnActive: {
    backgroundColor: '#2563eb',
    borderColor: '#2563eb',
  },
  slotText: {
    color: '#94a3b8',
    fontSize: 14,
    fontWeight: '600',
  },
  slotTextActive: {
    color: '#ffffff',
  },
  primaryBtn: {
    backgroundColor: '#2563eb',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 20,
  },
  primaryBtnDisabled: {
    backgroundColor: '#1e3a5f',
    opacity: 0.6,
  },
  primaryBtnText: {
    color: 'white',
    fontWeight: '700',
    fontSize: 15,
  },
  formCard: {
    backgroundColor: '#0f172a',
    borderRadius: 14,
    padding: 20,
    borderWidth: 1,
    borderColor: '#1e293b',
    marginTop: 16,
  },
  label: {
    color: '#94a3b8',
    fontSize: 13,
    marginBottom: 6,
    marginTop: 14,
  },
  required: {
    color: '#ef4444',
  },
  input: {
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#334155',
    color: '#e2e8f0',
    padding: 14,
    borderRadius: 10,
    fontSize: 15,
  },
  inputMulti: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  apptCard: {
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: '#1e293b',
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
  },
  apptCardSelected: {
    borderColor: '#38bdf8',
  },
  patientName: {
    color: '#e2e8f0',
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 4,
  },
  apptMeta: {
    color: '#64748b',
    fontSize: 13,
  },
  arrowHint: {
    color: '#38bdf8',
    fontSize: 12,
    fontWeight: '600',
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  patientBadge: {
    backgroundColor: '#1e3a5f',
    borderLeftWidth: 4,
    borderLeftColor: '#38bdf8',
    borderRadius: 10,
    padding: 14,
    marginBottom: 4,
  },
  patientBadgeLabel: {
    color: '#38bdf8',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 4,
  },
  patientBadgeName: {
    color: '#e2e8f0',
    fontSize: 17,
    fontWeight: '800',
  },
  patientBadgeMeta: {
    color: '#64748b',
    fontSize: 12,
    marginTop: 2,
  },
  bold: {
    color: '#e2e8f0',
    fontWeight: '700',
  },
  empty: {
    color: '#475569',
    textAlign: 'center',
    marginTop: 30,
    fontSize: 14,
  },
  logoutBtn: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 10,
    backgroundColor: '#7f1d1d',
    marginTop: 30,
  },
  logoutText: {
    color: '#fca5a5',
    fontSize: 14,
    fontWeight: '700',
  },

  // Ver historial previo
  secondaryBtn: {
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
  },
  secondaryBtnText: {
    color: '#38bdf8',
    fontWeight: '600',
    fontSize: 14,
  },

  // Historial cards
  historyCard: {
    backgroundColor: '#1e293b',
    borderRadius: 10,
    padding: 14,
    marginBottom: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#6366f1',
  },
  historyDate: {
    color: '#6366f1',
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 8,
  },
  historyRow: {
    marginBottom: 6,
  },
  historyLabel: {
    color: '#64748b',
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  historyValue: {
    color: '#e2e8f0',
    fontSize: 14,
    lineHeight: 20,
  },

  // Terminar cita
  finishBtn: {
    backgroundColor: '#7f1d1d',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 12,
  },
  finishBtnText: {
    color: '#fca5a5',
    fontWeight: '700',
    fontSize: 15,
  },
  finishBtnInline: {
    marginTop: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#7f1d1d',
    borderRadius: 8,
    alignSelf: 'flex-end',
  },
  finishBtnInlineText: {
    color: '#fca5a5',
    fontWeight: '700',
    fontSize: 13,
  },
});
