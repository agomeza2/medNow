import React, { JSX } from 'react';

import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  SafeAreaView
} from 'react-native';

interface User {
  id: number;
  name: string;
  role: string;
}

interface Doctor {
  id: number;
  name: string;
  specialty: string;
  schedule: string;
}

const users: User[] = [
  {
    id: 1,
    name: 'María López',
    role: 'Paciente'
  },
  {
    id: 2,
    name: 'Carlos Pérez',
    role: 'Paciente'
  }
];

const doctors: Doctor[] = [
  {
    id: 1,
    name: 'Dr. Carlos Ramirez',
    specialty: 'Cardiología',
    schedule: '08:00 AM - 02:00 PM'
  },
  {
    id: 2,
    name: 'Dra. Ana Torres',
    specialty: 'Dermatología',
    schedule: '10:00 AM - 06:00 PM'
  }
];

export default function AdminDashboard(): JSX.Element {

  return (

    <SafeAreaView style={styles.container}>

      {/* SIDEBAR */}

      <View style={styles.sidebar}>

        <Text style={styles.logo}>
          Panel Admin
        </Text>

        <TouchableOpacity style={styles.primaryButton}>
          <Text style={styles.buttonText}>
            Lista de usuarios
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.secondaryButton}>
          <Text style={styles.buttonText}>
            Lista de doctores
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.secondaryButton}>
          <Text style={styles.buttonText}>
            Horarios médicos
          </Text>
        </TouchableOpacity>

      </View>

      {/* CONTENIDO */}

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
      >

        <Text style={styles.sectionTitle}>
          Usuarios registrados
        </Text>

        {
          users.map((user) => (

            <View
              key={user.id}
              style={styles.card}
            >

              <Text style={styles.cardTitle}>
                {user.name}
              </Text>

              <Text style={styles.cardSubtitle}>
                Rol: {user.role}
              </Text>

            </View>

          ))
        }

        <Text style={styles.sectionTitle}>
          Doctores
        </Text>

        {
          doctors.map((doctor) => (

            <View
              key={doctor.id}
              style={styles.card}
            >

              <Text style={styles.cardTitle}>
                {doctor.name}
              </Text>

              <Text style={styles.cardSubtitle}>
                Especialidad: {doctor.specialty}
              </Text>

              <Text style={styles.cardSubtitle}>
                Horario: {doctor.schedule}
              </Text>

            </View>

          ))
        }

      </ScrollView>

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
    width: 320,
    backgroundColor: '#0f172a',
    padding: 20
  },

  logo: {
    color: 'white',
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 30
  },

  primaryButton: {
    backgroundColor: '#2563eb',
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

  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    textAlign: 'center'
  },

  content: {
    flex: 1,
    padding: 25
  },

  sectionTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#0f172a'
  },

  card: {
    backgroundColor: 'white',
    padding: 18,
    borderRadius: 14,
    marginBottom: 15,
    elevation: 3
  },

  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0f172a'
  },

  cardSubtitle: {
    marginTop: 6,
    color: '#475569'
  }

});