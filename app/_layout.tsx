import { Stack } from 'expo-router';

export default function RootLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: 'Карта' }} />
      <Stack.Screen name="marker/[id]" options={{ title: 'Детали маркера' }} />
    </Stack>
  );
}