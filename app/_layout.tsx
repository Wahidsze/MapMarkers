import * as Notifications from 'expo-notifications';
import { Stack } from 'expo-router';
import { useEffect } from 'react';
import { DBProvider } from '../contexts/DatabaseContext';

export default function RootLayout() {
  useEffect(() => {
    const notificationListener = Notifications.addNotificationResponseReceivedListener(response => {
      const markerId = response.notification.request.content.data?.markerId;
      console.log('Нажато уведомление с id маркера:', markerId);
    });

    return () => {
      notificationListener.remove();
    };
  }, []);

  return (
    <DBProvider>
      <Stack>
        <Stack.Screen name="index" options={{ title: 'Карта' }} />
        <Stack.Screen name="marker/[id]" options={{ title: 'Детали маркера' }} />
      </Stack>
    </DBProvider>
  );
}