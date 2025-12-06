import * as Location from 'expo-location';

export interface Marker {
  id: number;
  latitude: number;
  longitude: number;
  title: string;
  description?: string;
  color?: string;
  createdAt?: string;
}

export interface MarkerImage {
  id: number;
  uri: string;
  markerId: number;
  createdAt?: string;
}

export interface MarkerNavigationParams {
  [key: string]: any;
  id: string;
  latitude: string;
  longitude: string;
  title: string;
  description?: string;
  color?: string;
}

export interface IMarkerService {
  initializeDatabase(): Promise<void>;
  addMarker(marker: Omit<Marker, 'id'>): Promise<number>;
  deleteMarker(id: number): Promise<void>;
  getMarkers(): Promise<Marker[]>;
  addImage(image: Omit<MarkerImage, 'id'>): Promise<number>;
  deleteImage(id: number): Promise<void>;
  getMarkerImages(markerId: number): Promise<MarkerImage[]>;
  getMarkerColor(color?: string): string;
}

export const MARKER_COLORS = {
  RED: '#FF3B30',
  BLUE: '#007AFF', 
  GREEN: '#34C759',
  ORANGE: '#FF9500',
  PURPLE: '#AF52DE',
} as const;

export interface LocationConfig {
  accuracy: Location.Accuracy;
  timeInterval: number;
  distanceInterval: number;
}

export interface LocationState {
  location: Location.LocationObject | null;
  errorMsg: string | null;
}

export interface ActiveNotification {
  markerId: number;
  notificationId: string;
  timestamp: number;
}

export type MarkerColor = typeof MARKER_COLORS[keyof typeof MARKER_COLORS];