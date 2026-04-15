import { drizzle } from 'drizzle-orm/expo-sqlite';
import { openDatabaseSync } from 'expo-sqlite';
import * as schema from './schema';

// enableChangeListener powers useLiveQuery reactivity
export const expoDb = openDatabaseSync('deglem.db', { enableChangeListener: true });
export const db = drizzle(expoDb, { schema });
