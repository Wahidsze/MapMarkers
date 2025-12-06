import * as Location from 'expo-location';

export const LOCATION_CONFIG = {
  accuracy: Location.Accuracy.Balanced,
  timeInterval: 2000,
  distanceInterval: 5,
} as const;

export const DistanceShowNotification = 100;