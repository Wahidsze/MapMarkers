import * as SQLite from 'expo-sqlite';
import type { Marker, MarkerImage } from '../types';

export class DatabaseOperations {
  constructor(private db: SQLite.SQLiteDatabase) {}

  private logOperation(operation: string, data?: any): void {
    if (__DEV__) {
      console.log(`Операция в БД : ${operation}`, data || '');
    }
  }

  private logError(operation: string, error: any): void {
    if (__DEV__) {
      console.error(`Ошибка в БД : ${operation}:`, error);
    }
  }

  async addMarker(marker: Omit<Marker, 'id'>): Promise<number> {
    this.logOperation('addMarker', { 
      title: marker.title, 
      lat: marker.latitude, 
      lng: marker.longitude 
    });
    
    try {
      const result = await this.db.runAsync(
        `INSERT INTO markers (latitude, longitude, title, description, color) 
         VALUES (?, ?, ?, ?, ?)`,
        [marker.latitude, marker.longitude, marker.title, marker.description || null, marker.color || null]
      );
      
      if (!result || result.lastInsertRowId === undefined) {
        throw new Error('Не удалось получить ID созданного маркера');
      }
      
      this.logOperation('addMarker success', { id: result.lastInsertRowId });
      return result.lastInsertRowId;
    } catch (error) {
      this.logError('addMarker', error);
      throw error;
    }
  }

  async deleteMarker(id: number): Promise<void> {
    this.logOperation('deleteMarker', { id });

    try {
      await this.db.execAsync('BEGIN TRANSACTION;');
      this.logOperation('transaction started');
      
      await this.db.runAsync('DELETE FROM marker_images WHERE marker_id = ?', [id]);
      this.logOperation('deleted marker images', { markerId: id });
      
      await this.db.runAsync('DELETE FROM markers WHERE id = ?', [id]);
      this.logOperation('deleted marker', { id });
      
      await this.db.execAsync('COMMIT;');
      this.logOperation('transaction committed');
      
      console.log(`Маркер ${id} и связанные изображения удалены`);
    } catch (error) {
      this.logError('deleteMarker transaction', error);
      
      try {
        await this.db.execAsync('ROLLBACK;');
        this.logOperation('transaction rolled back');
      } catch (rollbackError) {
        this.logError('rollback', rollbackError);
      }
      
      throw error;
    }
  }

  async getMarkers(): Promise<Marker[]> {
    this.logOperation('getMarkers');
    
    try {
      const result = await this.db.getAllAsync<Marker>(
        'SELECT * FROM markers ORDER BY created_at DESC'
      );
      
      this.logOperation('getMarkers success', { count: result?.length || 0 });
      return result || [];
    } catch (error) {
      this.logError('getMarkers', error);
      throw error;
    }
  }

  async addImage(image: Omit<MarkerImage, 'id'>): Promise<number> {
    this.logOperation('addImage', { markerId: image.markerId });
    
    try {
      const result = await this.db.runAsync(
        'INSERT INTO marker_images (marker_id, uri) VALUES (?, ?)',
        [image.markerId, image.uri]
      );
      
      if (!result || result.lastInsertRowId === undefined) {
        throw new Error('Не удалось получить ID созданного изображения');
      }
      
      this.logOperation('addImage success', { id: result.lastInsertRowId });
      return result.lastInsertRowId;
    } catch (error) {
      this.logError('addImage', error);
      throw error;
    }
  }

  async deleteImage(id: number): Promise<void> {
    this.logOperation('deleteImage', { id });
    
    try {
      await this.db.runAsync('DELETE FROM marker_images WHERE id = ?', [id]);
      this.logOperation('deleteImage success', { id });
    } catch (error) {
      this.logError('deleteImage', error);
      throw error;
    }
  }

  async getMarkerImages(markerId: number): Promise<MarkerImage[]> {
    this.logOperation('getMarkerImages', { markerId });
    
    try {
      const result = await this.db.getAllAsync<MarkerImage>(
        'SELECT * FROM marker_images WHERE marker_id = ? ORDER BY created_at DESC',
        [markerId]
      );
      
      this.logOperation('getMarkerImages success', { 
        markerId, 
        count: result?.length || 0 
      });
      return result || [];
    } catch (error) {
      this.logError('getMarkerImages', error);
      throw error;
    }
  }
}