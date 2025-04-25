import { createClient as createWebClient } from "@libsql/client/web";
import { drizzle as drizzleSql, LibSQLDatabase } from "drizzle-orm/libsql";
/**
 * Database type enum
 * This can be extended with more database types in the future
 */
export enum DatabaseType {
  TURSO = 'turso',
  PG = 'pg',
}

/**
 * We use the DrizzleDB type as our primary database type
 * Currently this is just LibSQLDatabase, but can be expanded when more database types are added
 */
export type DrizzleDB = LibSQLDatabase;

/**
 * Factory function to get a database instance based on environment variables
 * 
 * @returns A database instance configured based on DATABASE_TYPE env variable
 */
export function getDatabaseFromEnv(): DrizzleDB {
  const dbType = (process.env.DATABASE_TYPE || 'turso').toLowerCase();
 console.warn(`Database type: ${dbType}`);
  switch (dbType) {
    case DatabaseType.TURSO:
      return getTursoDatabaseFromEnv();
    default:
      console.warn(`Unknown database type: ${dbType}, falling back to Turso`);
      return getTursoDatabaseFromEnv();
  }
}

/**
 * Get a database instance with specific connection parameters
 * 
 * @param type Database type (Turso, etc.)
 * @param config Connection configuration parameters
 * @returns A configured database instance
 */
export function getDatabase(type: DatabaseType, config: any): DrizzleDB {
  switch (type) {
    case DatabaseType.TURSO:
      return getTursoDatabase(config.url, config.authToken);
    default:
      throw new Error(`Unsupported database type: ${type}`);
  }
}

/**
 * Get a Turso database instance using environment variables
 */
function getTursoDatabaseFromEnv(): LibSQLDatabase {
  const client = createWebClient({
    url: process.env.TURSO_DB_URL || "",
    authToken: process.env.TURSO_DB_AUTH_TOKEN || "",
  });
  return drizzleSql(client);
}

/**
 * Get a Turso database instance with specific connection parameters
 */
function getTursoDatabase(url: string, authToken: string): LibSQLDatabase {
  return drizzleSql(createWebClient({ url, authToken }));
}


// Legacy functions for backward compatibility
export function getWebTursoDBFromEnv(): LibSQLDatabase {
  return getTursoDatabaseFromEnv();
}

export function getWebTursoDB(url: string, authToken: string): LibSQLDatabase {
  return getTursoDatabase(url, authToken);
}
