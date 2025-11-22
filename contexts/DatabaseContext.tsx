import * as SQLite from 'expo-sqlite';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { DatabaseOperations } from '../database/operations';
import { initializeDatabase } from '../database/schema';
import type { IMarkerService, Marker, MarkerImage } from '../types';
import { MARKER_COLORS } from '../types';

interface IDatabaseContext extends IMarkerService {
  isLoading: boolean;
  db: SQLite.SQLiteDatabase | null;
  isInitialized: boolean;
}

const DatabaseContext = createContext<IDatabaseContext | undefined>(undefined);

export const DBProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [db, setDb] = useState<SQLite.SQLiteDatabase | null>(null);
  const [operations, setOperations] = useState<DatabaseOperations | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);

  const initializeDB = async (retryCount = 0): Promise<void> => {
    try {
      setIsLoading(true);
      
      console.log(`Попытка инициализации базы данных... ${retryCount > 0 ? `(Попытка ${retryCount})` : ''}`);
      const database = await initializeDatabase();
      setDb(database);
      setOperations(new DatabaseOperations(database));
      setIsInitialized(true);
      
      console.log('База данных успешно инициализирована');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Неизвестная ошибка';
      
      if (retryCount < 3) {
        console.warn(`Ошибка инициализации БД, повтор через 2 секунды... (${retryCount + 1}/3)`);
        
        await new Promise(resolve => setTimeout(resolve, 2000));
        return initializeDB(retryCount + 1);
      }
      
      console.error(`Ошибка инициализации базы данных: ${errorMessage}`);
      console.error('Все попытки инициализации базы данных провалились: ', err);
      setIsInitialized(false);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    initializeDB();
    return () => {
      console.log('Очистка ресурсов DBProvider...');
      if (db) {
        try {
          db.closeAsync();
          console.log('Соединение с базой данных закрыто');
        } catch (error) {
          console.error('Ошибка при закрытии базы данных:', error);
        }
      }
    };
  }, []);

  const initializeDatabaseContext = async (): Promise<void> => {
    if (!isInitialized) {
      throw new Error('База данных еще не инициализирована');
    }
  };

  const addMarker = async (marker: Omit<Marker, 'id'>): Promise<number> => {
    if (!operations || !isInitialized) {
      throw new Error('База данных не инициализирована');
    }
    return await operations.addMarker(marker);
  };

  const deleteMarker = async (id: number): Promise<void> => {
    if (!operations || !isInitialized) {
      throw new Error('База данных не инициализирована');
    }
    await operations.deleteMarker(id);
  };

  const getMarkers = async (): Promise<Marker[]> => {
    if (!operations || !isInitialized) {
      console.warn('Попытка получить маркеры до инициализации База данных');
      return [];
    }
    return await operations.getMarkers();
  };

  const addImage = async (image: Omit<MarkerImage, 'id'>): Promise<number> => {
    if (!operations || !isInitialized) {
      throw new Error('База данных не инициализирована');
    }
    return await operations.addImage(image);
  };

  const deleteImage = async (id: number): Promise<void> => {
    if (!operations || !isInitialized) {
      throw new Error('База данных не инициализирована');
    }
    await operations.deleteImage(id);
  };

  const getMarkerImages = async (markerId: number): Promise<MarkerImage[]> => {
    if (!operations || !isInitialized) {
      console.warn('Попытка получить изображения до инициализации База данных');
      return [];
    }
    return await operations.getMarkerImages(markerId);
  };

  const getMarkerColor = (color?: string): string => {
    return color || MARKER_COLORS.RED;
  };

  const contextValue: IDatabaseContext = {
    isLoading,
    db,
    isInitialized,
    initializeDatabase: initializeDatabaseContext,
    addMarker,
    deleteMarker,
    getMarkers,
    addImage,
    deleteImage,
    getMarkerImages,
    getMarkerColor,
  };

  return (
    <DatabaseContext.Provider value={contextValue}>
      {children}
    </DatabaseContext.Provider>
  );
};

export const useDB = (): IDatabaseContext => {
  const context = useContext(DatabaseContext);
  if (context === undefined) {
    throw new Error('Контекст не определен');
  }
  return context;
};