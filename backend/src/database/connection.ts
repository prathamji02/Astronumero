import { getDatabase, initializeDatabaseSchema } from './schema.ts';
import type { DatabaseSync } from 'node:sqlite';

let initialized = false;

export function getDb(): DatabaseSync {
  const db = getDatabase();
  if (!initialized) {
    initializeDatabaseSchema(db);
    initialized = true;
  }
  return db;
}
