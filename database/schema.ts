import * as SQLite from 'expo-sqlite';

export const DATABASE_VERSION = 1;

export interface DatabaseConnection {
  db: SQLite.SQLiteDatabase;
}

export const openDatabase = (): Promise<SQLite.SQLiteDatabase> => {
  return new Promise((resolve, reject) => {
    try {
      const db = SQLite.openDatabaseSync('markers.db');
      resolve(db);
    } catch (error) {
      reject(error);
    }
  });
};

const createVersionTable = async (db: SQLite.SQLiteDatabase): Promise<void> => {
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS database_info (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      version INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    
    INSERT OR IGNORE INTO database_info (id, version) VALUES (1, 0);
  `);
};

const getCurrentVersion = async (db: SQLite.SQLiteDatabase): Promise<number> => {
  try {
    const result = await db.getFirstAsync<{ version: number }>(
      'SELECT version FROM database_info WHERE id = 1'
    );
    return result?.version || 0;
  } catch (error) {
    console.warn('Не удалось получить версию БД, используется версия 0');
    return 0;
  }
};

const updateVersion = async (db: SQLite.SQLiteDatabase, version: number): Promise<void> => {
  await db.runAsync(
    'UPDATE database_info SET version = ?, updated_at = CURRENT_TIMESTAMP WHERE id = 1',
    [version]
  );
};

const runMigrations = async (db: SQLite.SQLiteDatabase, fromVersion: number, toVersion: number): Promise<void> => {
  console.log(`Миграция БД с ${fromVersion} на ${toVersion}`);
  
  if (fromVersion < 1) {
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS markers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        latitude REAL NOT NULL,
        longitude REAL NOT NULL,
        title TEXT NOT NULL,
        description TEXT,
        color TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
      
      CREATE TABLE IF NOT EXISTS marker_images (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        marker_id INTEGER NOT NULL,
        uri TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (marker_id) REFERENCES markers (id) ON DELETE CASCADE
      );
      
      CREATE INDEX IF NOT EXISTS idx_marker_images_marker_id ON marker_images(marker_id);
    `);
    
    console.log('Миграция на версию 1 выполнена');
  }
};

export const initializeDatabase = async (): Promise<SQLite.SQLiteDatabase> => {
  try {    
    const db = await openDatabase();
    
    await db.execAsync('PRAGMA foreign_keys = ON;');
    
    await createVersionTable(db);
    
    const currentVersion = await getCurrentVersion(db);
    console.log(`Текущая версия БД: ${currentVersion}, целевая: ${DATABASE_VERSION}`);
    
    if (currentVersion < DATABASE_VERSION) {
      await runMigrations(db, currentVersion, DATABASE_VERSION);
      await updateVersion(db, DATABASE_VERSION);
      console.log(`БД обновлена до версии ${DATABASE_VERSION}`);
    } else {
      console.log('БД уже актуальной версии');
    }
    
    return db;
    
  } catch (error) {
    console.error('Ошибка инициализации базы данных: ', error);
    throw new Error(`Не удалось инициализировать базу данных: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`);
  }
};