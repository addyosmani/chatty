"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { initDatabase } from "@/lib/db";
import { migrateFromLocalStorage } from "@/lib/migration";

interface DatabaseContextType {
  isReady: boolean;
  isMigrating: boolean;
  error: Error | null;
}

const DatabaseContext = createContext<DatabaseContextType>({
  isReady: false,
  isMigrating: false,
  error: null,
});

export function useDatabaseContext() {
  return useContext(DatabaseContext);
}

interface DatabaseProviderProps {
  children: ReactNode;
}

export function DatabaseProvider({ children }: DatabaseProviderProps) {
  const [isReady, setIsReady] = useState(false);
  const [isMigrating, setIsMigrating] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function init() {
      try {
        // Initialize database
        await initDatabase();

        // Check for and perform migration from localStorage
        const hasLegacyData = localStorage.getItem("chatty-ui-state");
        if (hasLegacyData) {
          setIsMigrating(true);
          try {
            await migrateFromLocalStorage();
          } catch (migrationError) {
            console.error("Migration failed:", migrationError);
            // Continue even if migration fails - user can still use the app
          }
          setIsMigrating(false);
        }

        setIsReady(true);
      } catch (err) {
        console.error("Database initialization failed:", err);
        setError(err instanceof Error ? err : new Error("Database initialization failed"));
      }
    }

    init();
  }, []);

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center p-8 max-w-md">
          <div className="text-destructive mb-4">
            <svg
              className="w-12 h-12 mx-auto"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <h2 className="text-lg font-semibold mb-2">Database Error</h2>
          <p className="text-muted-foreground text-sm mb-4">
            {error.message}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!isReady) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-muted-foreground">
            {isMigrating ? "Migrating your data..." : "Initializing..."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <DatabaseContext.Provider value={{ isReady, isMigrating, error }}>
      {children}
    </DatabaseContext.Provider>
  );
}
