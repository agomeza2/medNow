import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  SafeAreaView
} from 'react-native';

import { Calendar } from 'react-native-calendars';

const doctors = [
  {
    id: 1,
    name: 'Dr. Carlos Ramirez',
    specialty: 'Cardiología'
  },
  {
    id: 2,
    name: 'Dra. Ana Torres',
    specialty: 'Dermatología'
  },
  {
    id: 3,
    name: 'Dr. Juan Herrera',
    specialty: 'Neurología'
  }
];

export default function Dashboard() {

  return (

    <SafeAreaView style={styles.container}>

      {/* COLUMNA IZQUIERDA */}

      <View style={styles.sidebar}>

        <Text style={styles.logo}>
          Medical App
        </Text>

        <TouchableOpacity style={styles.actionButton}>
          <Text style={styles.actionText}>
            Agendar cita
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.cancelButton}>
          <Text style={styles.actionText}>
            Cancelar cita
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.secondaryButton}>
          <Text style={styles.actionText}>
            Historial
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.secondaryButton}>
          <Text style={styles.actionText}>
            Perfil
          </Text>
        </TouchableOpacity>

        <Text style={styles.sectionTitle}>
          Médicos
        </Text>

        <ScrollView>

          {
            doctors.map((doctor) => (

              <View
                key={doctor.id}
                style={styles.doctorCard}
              >

                <Text style={styles.doctorName}>
                  {doctor.name}
                </Text>

                <Text style={styles.specialty}>
                  {doctor.specialty}
                </Text>

              </View>

            ))
          }

        </ScrollView>

      </View>

      {/* CALENDARIO */}

      <View style={styles.calendarContainer}>

        <Text style={styles.calendarTitle}>
          Calendario de citas
        </Text>

        <Calendar
          style={styles.calendar}
          theme={{
            todayTextColor: '#2563eb',
            arrowColor: '#2563eb',
            monthTextColor: '#0f172a'
          }}
        />

      </View>

    </SafeAreaView>

  );
}

const styles = StyleSheet.create({

  container: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#f1f5f9'
  },

  sidebar: {
    width: 300,
    backgroundColor: '#0f172a',
    padding: 20
  },

  logo: {
    color: 'white',
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 30
  },

  actionButton: {
    backgroundColor: '#2563eb',
    padding: 15,
    borderRadius: 14,
    marginBottom: 15
  },

  cancelButton: {
    backgroundColor: '#dc2626',
    padding: 15,
    borderRadius: 14,
    marginBottom: 15
  },

  secondaryButton: {
    backgroundColor: '#334155',
    padding: 15,
    borderRadius: 14,
    marginBottom: 15
  },

  actionText: {
    color: 'white',
    fontWeight: 'bold',
    textAlign: 'center'
  },

  sectionTitle: {
    color: 'white',
    fontSize: 22,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 15
  },

  doctorCard: {
    backgroundColor: '#1e293b',
    padding: 15,
    borderRadius: 14,
    marginBottom: 12
  },

  doctorName: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16
  },

  specialty: {
    color: '#cbd5e1',
    marginTop: 5
  },

  calendarContainer: {
    flex: 1,
    padding: 25,
    justifyContent: 'center'
  },

  calendarTitle: {
    fontSize: 30,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#0f172a'
  },

  calendar: {
    borderRadius: 20,
    padding: 10,
    elevation: 4
  }

});