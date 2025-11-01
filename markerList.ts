import { Marker, MARKER_COLORS, MarkerImage } from './types';

let markersStorage: Marker[] = [];
let imagesStorage: MarkerImage[] = [];

export const MarkerList = {
  getMarkers: () => markersStorage,
  setMarkers: (newMarkers: Marker[]) => { markersStorage = newMarkers; },
  getImages: (markerId?: string) =>
    markerId ? imagesStorage.filter(img => img.markerId === markerId) : imagesStorage,
  setImages: (newImages: MarkerImage[]) => { imagesStorage = newImages; },
  deleteMarker: (id: string) => {
    markersStorage = markersStorage.filter(m => m.id !== id);
    imagesStorage = imagesStorage.filter(img => img.markerId !== id);
  },
  getMarkerColor: (color?: string) => color || MARKER_COLORS.RED,
};