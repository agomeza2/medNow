import { useState } from 'react';

import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet
} from 'react-native';

import { router } from 'expo-router';

export default function RegisterScreen() {

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  return (

    <View style={styles.container}>

      <Text style={styles.title}>
        Registro
      </Text>

      <TextInput
        placeholder="Nombre"
        style={styles.input}
        value={name}
        onChangeText={setName}
      />

      <TextInput
        placeholder="Email"
        style={styles.input}
        value={email}
        onChangeText={setEmail}
      />

      <TextInput
        placeholder="Password"
        secureTextEntry
        style={styles.input}
        value={password}
        onChangeText={setPassword}
      />

      <TouchableOpacity
        style={styles.button}
        onPress={() => router.replace('/dashboard')}
      >
        <Text style={styles.buttonText}>
          Registrarse
        </Text>
      </TouchableOpacity>

    </View>

  );
}

const styles = StyleSheet.create({

  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20
  },

  title: {
    fontSize: 32,
    marginBottom: 20,
    fontWeight: 'bold'
  },

  input: {
    borderWidth: 1,
    padding: 12,
    marginBottom: 15,
    borderRadius: 10
  },

  button: {
    backgroundColor: '#16a34a',
    padding: 15,
    borderRadius: 10
  },

  buttonText: {
    color: 'white',
    textAlign: 'center',
    fontWeight: 'bold'
  }

});