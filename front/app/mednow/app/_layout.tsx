import { Stack } from 'expo-router';

export default function Layout() {
  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{ title: 'Login' }}
      />

      <Stack.Screen
        name="register"
        options={{ title: 'Registro' }}
      />

      <Stack.Screen
        name="dashboard"
        options={{ title: 'Dashboard' }}
      />
    </Stack>
  );
}