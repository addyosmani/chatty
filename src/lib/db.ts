import initSqlJs, { Database as SqlJsDatabase } from "sql.js";
import { drizzle, SQLJsDatabase } from "drizzle-orm/sql-js";
import * as schema from "@/db/schema";

let db: SQLJsDatabase<typeof schema> | null = null;
let sqliteDb: SqlJsDatabase | null = null;
let initPromise: Promise<SQLJsDatabase<typeof schema>> | null = null;

const DB_NAME = "chatty-sqlite";
const STORE_NAME = "database";

/**
 * Initialize the database. Returns existing instance if already initialized.
 */
export async function initDatabase(): Promise<SQLJsDatabase<typeof schema>> {
  // Return existing instance
  if (db) return db;

  // Return pending initialization
  if (initPromise) return initPromise;

  // Start initialization
  initPromise = (async () => {
    const SQL = await initSqlJs({
      locateFile: (file) => `https://sql.js.org/dist/${file}`,
    });

    // Try to load existing database from IndexedDB
    const savedData = await loadFromIndexedDB();

    if (savedData) {
      sqliteDb = new SQL.Database(savedData);
    } else {
      sqliteDb = new SQL.Database();
    }

    db = drizzle(sqliteDb, { schema });

    // Run migrations (create tables if not exist)
    await runMigrations(sqliteDb);

    return db;
  })();

  return initPromise;
}

/**
 * Get the database instance. Throws if not initialized.
 */
export function getDatabase(): SQLJsDatabase<typeof schema> {
  if (!db) {
    throw new Error("Database not initialized. Call initDatabase() first.");
  }
  return db;
}

/**
 * Check if database is initialized
 */
export function isDatabaseInitialized(): boolean {
  return db !== null;
}

/**
 * Run migrations to create tables
 */
async function runMigrations(sqliteDb: SqlJsDatabase) {
  sqliteDb.run(`
    CREATE TABLE IF NOT EXISTS chats (
      id TEXT PRIMARY KEY,
      title TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS messages (
      id TEXT PRIMARY KEY,
      chat_id TEXT NOT NULL REFERENCES chats(id) ON DELETE CASCADE,
      role TEXT NOT NULL CHECK(role IN ('user', 'assistant', 'system')),
      content TEXT NOT NULL,
      content_type TEXT DEFAULT 'text',
      metadata TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS documents (
      id TEXT PRIMARY KEY,
      file_name TEXT NOT NULL,
      file_type TEXT NOT NULL,
      file_size INTEGER NOT NULL,
      content TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS document_chunks (
      id TEXT PRIMARY KEY,
      document_id TEXT NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
      chunk_index INTEGER NOT NULL,
      content TEXT NOT NULL,
      embedding BLOB,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_messages_chat_id ON messages(chat_id);
    CREATE INDEX IF NOT EXISTS idx_document_chunks_document_id ON document_chunks(document_id);
  `);

  // Save after migrations
  await saveDatabase();
}

/**
 * Save the database to IndexedDB
 */
export async function saveDatabase(): Promise<void> {
  if (!sqliteDb) return;
  const data = sqliteDb.export();
  await saveToIndexedDB(new Uint8Array(data));
}

/**
 * Load database from IndexedDB
 */
async function loadFromIndexedDB(): Promise<Uint8Array | null> {
  return new Promise((resolve) => {
    const request = indexedDB.open(DB_NAME, 1);

    request.onerror = () => resolve(null);

    request.onsuccess = () => {
      const idb = request.result;
      try {
        const tx = idb.transaction(STORE_NAME, "readonly");
        const store = tx.objectStore(STORE_NAME);
        const getRequest = store.get("sqlite-data");

        getRequest.onsuccess = () => resolve(getRequest.result || null);
        getRequest.onerror = () => resolve(null);
      } catch {
        resolve(null);
      }
    };

    request.onupgradeneeded = () => {
      const idb = request.result;
      if (!idb.objectStoreNames.contains(STORE_NAME)) {
        idb.createObjectStore(STORE_NAME);
      }
    };
  });
}

/**
 * Save database to IndexedDB
 */
async function saveToIndexedDB(data: Uint8Array): Promise<void> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);

    request.onerror = () => reject(request.error);

    request.onsuccess = () => {
      const idb = request.result;
      try {
        const tx = idb.transaction(STORE_NAME, "readwrite");
        const store = tx.objectStore(STORE_NAME);
        store.put(data, "sqlite-data");

        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      } catch (error) {
        reject(error);
      }
    };

    request.onupgradeneeded = () => {
      const idb = request.result;
      if (!idb.objectStoreNames.contains(STORE_NAME)) {
        idb.createObjectStore(STORE_NAME);
      }
    };
  });
}

/**
 * Clear the database (for testing/reset)
 */
export async function clearDatabase(): Promise<void> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.deleteDatabase(DB_NAME);
    request.onsuccess = () => {
      db = null;
      sqliteDb = null;
      initPromise = null;
      resolve();
    };
    request.onerror = () => reject(request.error);
  });
}
