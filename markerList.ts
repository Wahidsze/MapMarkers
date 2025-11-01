import type { IMarkerList, Marker, MarkerImage } from './types';
import { MARKER_COLORS } from './types';

let markersStorage: Marker[] = [];
let imagesStorage: MarkerImage[] = [];

export const MarkerList: IMarkerList = {
  getMarkers: () => markersStorage,
  setMarkers: (newMarkers) => { markersStorage = newMarkers; },
  getImages: (markerId) => 
    markerId ? imagesStorage.filter(img => img.markerId === markerId) : imagesStorage,
  setImages: (newImages) => { imagesStorage = newImages; },
  deleteMarker: (id) => {
    markersStorage = markersStorage.filter(m => m.id !== id);
    imagesStorage = imagesStorage.filter(img => img.markerId !== id);
  },
  getMarkerColor: (color) => color || MARKER_COLORS.RED,
};