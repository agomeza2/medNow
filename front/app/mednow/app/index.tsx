import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView
} from 'react-native';

import { router } from 'expo-router';

export default function LoginScreen() {

  const goDashboard = () => {
    router.replace('/dashboard');
  };

  return (

    <SafeAreaView style={styles.container}>

      <View style={styles.card}>

        <Text style={styles.title}>
          Medical App
        </Text>

        <Text style={styles.subtitle}>
          Gestión inteligente de citas médicas
        </Text>

        <TextInput
          placeholder="Usuario"
          placeholderTextColor="#888"
          style={styles.input}
        />

        <TextInput
          placeholder="Contraseña"
          placeholderTextColor="#888"
          secureTextEntry
          style={styles.input}
        />

        <TouchableOpacity
          style={styles.loginButton}
          onPress={goDashboard}
        >
          <Text style={styles.buttonText}>
            Iniciar sesión
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.googleButton}
          onPress={goDashboard}
        >
          <Text style={styles.buttonText}>
            Continuar con Google SSO
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.testButton}
          onPress={goDashboard}
        >
          <Text style={styles.buttonText}>
            Entrar al Dashboard (Prueba)
          </Text>
        </TouchableOpacity>

      </View>

    </SafeAreaView>

  );
}

const styles = StyleSheet.create({

  container: {
    flex: 1,
    backgroundColor: '#0f172a',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20
  },

  card: {
    width: '100%',
    backgroundColor: '#1e293b',
    padding: 25,
    borderRadius: 25
  },

  title: {
    color: 'white',
    fontSize: 36,
    fontWeight: 'bold',
    marginBottom: 10
  },

  subtitle: {
    color: '#cbd5e1',
    marginBottom: 30,
    fontSize: 16
  },

  input: {
    backgroundColor: '#334155',
    color: 'white',
    padding: 15,
    borderRadius: 14,
    marginBottom: 15,
    fontSize: 16
  },

  loginButton: {
    backgroundColor: '#2563eb',
    padding: 16,
    borderRadius: 14,
    marginBottom: 15
  },

  googleButton: {
    backgroundColor: '#dc2626',
    padding: 16,
    borderRadius: 14,
    marginBottom: 15
  },

  testButton: {
    backgroundColor: '#059669',
    padding: 16,
    borderRadius: 14
  },

  buttonText: {
    color: 'white',
    textAlign: 'center',
    fontWeight: 'bold',
    fontSize: 16
  }

});