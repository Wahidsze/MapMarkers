import { Stack } from 'expo-router';
import { DBProvider } from '../contexts/DatabaseContext';

export default function RootLayout() {
  return (
    <DBProvider>
      <Stack>
        <Stack.Screen name="index" options={{ title: 'Карта' }} />
        <Stack.Screen name="marker/[id]" options={{ title: 'Детали маркера' }} />
      </Stack>
    </DBProvider>
  );
}