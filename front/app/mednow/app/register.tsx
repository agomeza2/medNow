import { useState }
  from 'react';

import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert
} from 'react-native';

import { router }
  from 'expo-router';

import { register }
  from '../scripts/register';

export default function RegisterScreen() {

  const [name, setName] =
    useState('');

  const [lastName, setLastName] =
    useState('');

  const [username, setUsername] =
    useState('');

  const [password, setPassword] =
    useState('');

  const [identification, setIdentification] =
    useState('');

  const [email, setEmail] =
    useState('');

  const [bloodType, setBloodType] =
    useState('');

  const [rh, setRh] =
    useState('');

  const [phone, setPhone] =
    useState('');

  const [height, setHeight] =
    useState('');

  async function handleRegister() {

    try {

      if (
        !name ||
        !lastName ||
        !username ||
        !password ||
        !email
      ) {

        Alert.alert(
          'Error',
          'Completa los campos obligatorios'
        );

        return;

      }

      const userData = {

        name,
        last_name: lastName,
        username,
        password,
        identification,
        email,
        blood_type: bloodType,
        rh,
        phone,
        height

      };

      const result =
        await register(
          userData
        );

      console.log(result);

      Alert.alert(
        'Éxito',
        'Cuenta creada correctamente'
      );

      router.replace('/');

    } catch (error) {

      if (error instanceof Error) {

        Alert.alert(
          'Error',
          error.message
        );

      } else {

        Alert.alert(
          'Error',
          'No se pudo registrar'
        );

      }

    }

  }

  return (

    <ScrollView
      style={styles.container}
      contentContainerStyle={{
        paddingBottom: 60
      }}
      showsVerticalScrollIndicator={false}
    >

      <Text style={styles.title}>
        Crear cuenta
      </Text>

      <Text style={styles.subtitle}>
        Registra tus datos médicos
      </Text>

      {/* NOMBRE */}

      <TextInput
        placeholder="Nombre"
        placeholderTextColor="#94a3b8"
        style={styles.input}
        value={name}
        onChangeText={setName}
      />

      {/* APELLIDO */}

      <TextInput
        placeholder="Apellido"
        placeholderTextColor="#94a3b8"
        style={styles.input}
        value={lastName}
        onChangeText={setLastName}
      />

      {/* USUARIO */}

      <TextInput
        placeholder="Usuario"
        placeholderTextColor="#94a3b8"
        style={styles.input}
        value={username}
        onChangeText={setUsername}
      />

      {/* PASSWORD */}

      <TextInput
        placeholder="Contraseña"
        placeholderTextColor="#94a3b8"
        secureTextEntry
        style={styles.input}
        value={password}
        onChangeText={setPassword}
      />

      {/* IDENTIFICACIÓN */}

      <TextInput
        placeholder="Identificación"
        placeholderTextColor="#94a3b8"
        style={styles.input}
        keyboardType="numeric"
        value={identification}
        onChangeText={setIdentification}
      />

      {/* EMAIL */}

      <TextInput
        placeholder="Correo electrónico"
        placeholderTextColor="#94a3b8"
        style={styles.input}
        keyboardType="email-address"
        autoCapitalize="none"
        value={email}
        onChangeText={setEmail}
      />

      {/* TIPO DE SANGRE */}

      <TextInput
        placeholder="Tipo de sangre (A, B, AB, O)"
        placeholderTextColor="#94a3b8"
        style={styles.input}
        value={bloodType}
        onChangeText={setBloodType}
      />

      {/* RH */}

      <TextInput
        placeholder="RH (+ o -)"
        placeholderTextColor="#94a3b8"
        style={styles.input}
        value={rh}
        onChangeText={setRh}
      />

      {/* CELULAR */}

      <TextInput
        placeholder="Celular"
        placeholderTextColor="#94a3b8"
        style={styles.input}
        keyboardType="phone-pad"
        value={phone}
        onChangeText={setPhone}
      />

      {/* ALTURA */}

      <TextInput
        placeholder="Altura (cm)"
        placeholderTextColor="#94a3b8"
        style={styles.input}
        keyboardType="numeric"
        value={height}
        onChangeText={setHeight}
      />

      {/* REGISTER */}

      <TouchableOpacity
        style={styles.button}
        onPress={handleRegister}
      >

        <Text style={styles.buttonText}>
          Registrarse
        </Text>

      </TouchableOpacity>

      {/* LOGIN */}

      <TouchableOpacity
        style={styles.loginButton}
        onPress={() =>
          router.push('/')
        }
      >

        <Text style={styles.loginText}>
          Ya tengo cuenta
        </Text>

      </TouchableOpacity>

    </ScrollView>

  );

}

const styles = StyleSheet.create({

  container: {
    flex: 1,
    backgroundColor: '#020617',
    padding: 25
  },

  title: {
    color: 'white',
    fontSize: 40,
    fontWeight: 'bold',
    marginTop: 60,
    marginBottom: 10
  },

  subtitle: {
    color: '#94a3b8',
    fontSize: 16,
    marginBottom: 35
  },

  input: {
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: '#1e293b',
    color: 'white',
    padding: 18,
    borderRadius: 16,
    marginBottom: 18,
    fontSize: 16
  },

  button: {
    backgroundColor: '#2563eb',
    padding: 18,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 10
  },

  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16
  },

  loginButton: {
    marginTop: 20,
    alignItems: 'center'
  },

  loginText: {
    color: '#94a3b8',
    fontSize: 15
  }

});