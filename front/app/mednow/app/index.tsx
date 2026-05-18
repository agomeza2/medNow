import {
  View,
  TextInput,
  TouchableOpacity,
  Alert,
  Text,
  StyleSheet,
  ActivityIndicator
} from 'react-native';

import { useState } from 'react';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { login } from '../scripts/login';

export default function LoginScreen() {
  const router = useRouter();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    if (!username.trim() || !password.trim()) {
      Alert.alert('Error', 'Completa todos los campos');
      return;
    }

    try {
      setLoading(true);

      const result = await login(username, password);

      console.log('LOGIN:', result);

      // Guardar token
      if (result?.token) {
        await AsyncStorage.setItem('token', result.token);
      } else {
        throw new Error('Token no recibido del backend');
      }

      Alert.alert('Bienvenido');

      // 🔥 NAVIGACIÓN SEGURA POR ROLE
      const role = result?.role;

      if (role === 'patient') {
        router.replace('/dashboard');
      } else if (role === 'doctor') {
        router.replace('/doctor_dashboard');
      } else if (role === 'admin') {
        router.replace('/admin_panel');
      } else {
        Alert.alert('Error', 'Rol inválido');
      }

    } catch (error) {
      console.log('LOGIN SCREEN ERROR:', error);

      if (error instanceof Error) {
        Alert.alert('Error', error.message);
      } else {
        Alert.alert('Error', 'Ocurrió un error');
      }

    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.container}>

      <View style={styles.header}>
        <Text style={styles.title}>Medical App</Text>
        <Text style={styles.subtitle}>Inicia sesión para continuar</Text>
      </View>

      <TextInput
        placeholder="Usuario"
        placeholderTextColor="#94a3b8"
        autoCapitalize="none"
        value={username}
        onChangeText={setUsername}
        style={styles.input}
      />

      <TextInput
        placeholder="Contraseña"
        placeholderTextColor="#94a3b8"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
        style={styles.input}
      />

      <TouchableOpacity
        style={styles.loginButton}
        onPress={handleLogin}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="white" />
        ) : (
          <Text style={styles.loginText}>Iniciar sesión</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.registerButton}
        onPress={() => router.push('/register')}
      >
        <Text style={styles.registerText}>Crear cuenta</Text>
      </TouchableOpacity>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#020617',
    justifyContent: 'center',
    padding: 30
  },

  header: {
    marginBottom: 45
  },

  title: {
    color: 'white',
    fontSize: 42,
    fontWeight: 'bold',
    marginBottom: 10
  },

  subtitle: {
    color: '#94a3b8',
    fontSize: 16
  },

  input: {
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: '#1e293b',
    color: 'white',
    padding: 18,
    borderRadius: 16,
    marginBottom: 20,
    fontSize: 16
  },

  loginButton: {
    backgroundColor: '#2563eb',
    padding: 18,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    minHeight: 60
  },

  loginText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16
  },

  registerButton: {
    backgroundColor: '#111827',
    padding: 18,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155'
  },

  registerText: {
    color: '#cbd5e1',
    fontWeight: 'bold',
    fontSize: 16
  }
});