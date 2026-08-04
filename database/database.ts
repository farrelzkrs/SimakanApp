import * as SQLite from 'expo-sqlite';

const DB_NAME = 'kantin_darut_tauhid.db';

let dbInstance: SQLite.SQLiteDatabase | null = null;

export async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (dbInstance) {
    return dbInstance;
  }

  dbInstance = await SQLite.openDatabaseAsync(DB_NAME);

  await dbInstance.execAsync('PRAGMA journal_mode = WAL');
  await dbInstance.execAsync('PRAGMA foreign_keys = ON');

  return dbInstance;
}

export async function closeDatabase(): Promise<void> {
  if (dbInstance) {
    await dbInstance.closeAsync();
    dbInstance = null;
  }
}
