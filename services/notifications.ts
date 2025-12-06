import * as Notifications from 'expo-notifications';
import { Marker } from '../types';

interface ScheduledNotification {
  notificationId: string;
  markerId: number;
  timestamp: number;
}

export class NotificationManager {
  private shownMarkers: Set<number>;
  private scheduledNotifications: Map<number, ScheduledNotification>;

  constructor() {
    this.shownMarkers = new Set();
    this.scheduledNotifications = new Map();
    
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldPlaySound: true,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });
  }

  async requestPermissions(): Promise<boolean> {
    try {
      const { status } = await Notifications.requestPermissionsAsync();
      console.log('Статус разрешения уведомлений:', status);
      return status === 'granted';
    } catch (error) {
      console.error('Ошибка запроса разрешения уведомлений:', error);
      return false;
    }
  }

  async showNotification(marker: Marker): Promise<void> {
    console.log(`Проверка были ли показаны уведомления для маркера с Id: ${marker.id}, названием: ${marker.title}`);
    
    if (this.shownMarkers.has(marker.id)) {
      console.log(`Для маркера с Id: ${marker.id} было показано уведомление раньше`);
      return;
    }

    try {
      console.log('Отправка уведомления');
      
      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: "Вы рядом с меткой!",
          body: `Вы находитесь рядом с точкой "${marker.title}"`,
          data: { markerId: marker.id },
        },
        trigger: null,
      });

      this.scheduledNotifications.set(marker.id, {
        notificationId,
        markerId: marker.id,
        timestamp: Date.now()
      });

      this.shownMarkers.add(marker.id);
      console.log(`Для маркера ${marker.title}, ID: ${notificationId} показано уведомление`);

    } catch (error) {
      console.error('Ошибка уведомления: ', error);
    }
  }

  async removeNotification(markerId: number): Promise<void> {
    try {
      const scheduledNotification = this.scheduledNotifications.get(markerId);
      
      if (scheduledNotification) {
        console.log(`Удаление уведомления ${scheduledNotification.notificationId} для маркера ${markerId}`);
        
        await Notifications.cancelScheduledNotificationAsync(scheduledNotification.notificationId);
        
        try {
          await Notifications.dismissNotificationAsync(scheduledNotification.notificationId);
        } catch (error) {
          console.log('Не удалось скрыть уведомление');
        }
        
        this.scheduledNotifications.delete(markerId);
        this.shownMarkers.delete(markerId);
        
        console.log(`Уведомление для маркера ${markerId} удалено`);
      }
    } catch (error) {
      console.error(`Ошибка удаления уведомления для маркера ${markerId}: `, error);
    }
  }

  resetMarker(markerId: number): void {
    this.shownMarkers.delete(markerId);
    this.scheduledNotifications.delete(markerId);
  }

  clearOldMarkers(currentMarkers: Set<number>): void {
    const markersToRemove: number[] = [];
    
    for (const markerId of this.shownMarkers) {
      if (!currentMarkers.has(markerId)) {
        markersToRemove.push(markerId);
      }
    }
    
    markersToRemove.forEach(markerId => {
      this.removeNotification(markerId);
    });
  }

  getShownCount(): number {
    return this.shownMarkers.size;
  }
}