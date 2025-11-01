export interface Marker {
  id: string;
  latitude: number;
  longitude: number;
  title: string;
  description?: string;
  color?: string;
}

export interface MarkerImage {
  id: string;
  uri: string;
  markerId: string;
  createdAt: Date;
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

export const MARKER_COLORS = {
  RED: '#FF3B30',
  BLUE: '#007AFF', 
  GREEN: '#34C759',
  ORANGE: '#FF9500',
  PURPLE: '#AF52DE',
} as const;

export type MarkerColor = typeof MARKER_COLORS[keyof typeof MARKER_COLORS];