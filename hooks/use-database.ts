import type { SQLiteDatabase } from 'expo-sqlite';
import { useEffect, useState } from 'react';
import { getDatabase } from '../database/database';
import { migrateDatabase } from '../scripts/migration';

interface UseDatabaseResult {
  db: SQLiteDatabase | null;
  isReady: boolean;
  error: Error | null;
}

export function useDatabase(): UseDatabaseResult {
  const [db, setDb] = useState<SQLiteDatabase | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let mounted = true;

    async function init() {
      try {
        const database = await getDatabase();
        await migrateDatabase(database);

        if (mounted) {
          setDb(database);
          setIsReady(true);
        }
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err : new Error(String(err)));
        }
      }
    }

    init();

    return () => {
      mounted = false;
    };
  }, []);

  return { db, isReady, error };
}
