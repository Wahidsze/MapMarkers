import * as Location from 'expo-location';
import { getDistance, isPointWithinRadius } from 'geolib';
import { DistanceShowNotification, LOCATION_CONFIG } from './config';

export const requestLocationPermissions = async (): Promise<boolean> => {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    return status === 'granted';
  } catch (error) {
    return false;
  }
};

export const calculateDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  return getDistance(
    { latitude: lat1, longitude: lon1 },
    { latitude: lat2, longitude: lon2 }
  );
};

export const isWithinNotificationRadius = (
  userLat: number,
  userLng: number,
  markerLat: number,
  markerLng: number
): boolean => {
  return isPointWithinRadius(
    { latitude: userLat, longitude: userLng },
    { latitude: markerLat, longitude: markerLng },
    DistanceShowNotification
  );
};

export const startLocationUpdates = async (
  onLocation: (location: Location.LocationObject) => void
): Promise<Location.LocationSubscription> => {
  return await Location.watchPositionAsync(
    {
      accuracy: LOCATION_CONFIG.accuracy,
      timeInterval: LOCATION_CONFIG.timeInterval,
      distanceInterval: LOCATION_CONFIG.distanceInterval,
    },
    onLocation
  );
};

export const getCurrentLocation = async (): Promise<Location.LocationObject | null> => {
  try {
    const location = await Location.getCurrentPositionAsync({
      accuracy: LOCATION_CONFIG.accuracy,
    });
    return location;
  } catch (error) {
    return null;
  }
};

export { DistanceShowNotification };

