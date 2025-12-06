import * as Location from 'expo-location';
import { useCallback, useEffect, useRef, useState } from 'react';
import { getCurrentLocation, requestLocationPermissions, startLocationUpdates } from '../services/location';

export const useLocationTracker = () => {
  const [userLocation, setUserLocation] = useState<Location.LocationObject | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const locationSubscriptionRef = useRef<Location.LocationSubscription | null>(null);
  const isTrackingRef = useRef(false);

  const startTracking = useCallback(async (onLocationUpdate?: (location: Location.LocationObject) => void) => {
    try {
      if (isTrackingRef.current) {
        console.log('Отслеживание уже запущено');
        return;
      }

      setLocationError(null);
      
      const hasLocationPermission = await requestLocationPermissions();
      
      if (!hasLocationPermission) {
        setLocationError("Разрешение на геолокацию не предоставлено");
        return;
      }

      const currentLocation = await getCurrentLocation();
      
      if (!currentLocation) {
        const defaultLocation: Location.LocationObject = {
          coords: {
            latitude: 58.007124,
            longitude: 56.188173,
            altitude: 0,
            accuracy: 10,
            altitudeAccuracy: 0,
            heading: 0,
            speed: 0,
          },
          timestamp: Date.now(),
          mocked: true,
        };
        setUserLocation(defaultLocation);
        if (onLocationUpdate) {
          onLocationUpdate(defaultLocation);
        }
      } else {
        setUserLocation(currentLocation);
        if (onLocationUpdate) {
           onLocationUpdate(currentLocation);
        }
      }
      
      locationSubscriptionRef.current = await startLocationUpdates((location) => {
        console.log('Местоположение обновлено');
        setUserLocation(location);
        if (onLocationUpdate) {
          onLocationUpdate(location);
        }
      });

      isTrackingRef.current = true;
      
    } catch (error: any) {
      console.error('Ошибка начала отслеживания: ', error);
      setLocationError("Не удалось начать отслеживание.");
    }
  }, []);

  const stopTracking = useCallback(() => {
    if (locationSubscriptionRef.current) {
      locationSubscriptionRef.current.remove();
      locationSubscriptionRef.current = null;
    }
    isTrackingRef.current = false;
  }, []);

  useEffect(() => {
    startTracking();

    return () => {
      stopTracking();
    };
  }, [startTracking, stopTracking]);

  return {
    userLocation,
    locationError,
    startTracking,
    stopTracking,
    setUserLocation,
  };
};