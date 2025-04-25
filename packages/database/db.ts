import { createClient as createWebClient } from "@libsql/client/web";
import { drizzle as drizzleSql, LibSQLDatabase } from "drizzle-orm/libsql";
import { drizzle as drizzlePg } from "drizzle-orm/postgres-js";
import { drizzle as drizzleNeon, type NeonDatabase } from "drizzle-orm/neon-serverless";
import postgres from "postgres";
import { Pool, neonConfig } from '@neondatabase/serverless';
import { sql } from "drizzle-orm";

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
 * This is a union type of all supported database types
 */
export type DrizzleDB = LibSQLDatabase | ReturnType<typeof drizzlePg> | NeonDatabase;

// Type guard to check if a database instance is a PostgreSQL database
export function isPostgresDB(db: DrizzleDB): db is ReturnType<typeof drizzlePg> | NeonDatabase {
  return 'execute' in db && !('batch' in db);
}

// Type guard to check if a database instance is a SQLite database
export function isSQLiteDB(db: DrizzleDB): db is LibSQLDatabase {
  return 'batch' in db;
}

/**
 * Factory function to get a database instance based on environment variables
 * 
 * @returns A database instance configured based on DATABASE_TYPE env variable
 */
export function getDatabaseFromEnv(): DrizzleDB {
  const dbType = (process.env.DATABASE_TYPE || 'turso').toLowerCase();
  console.log(`Database type: ${dbType}`);
  switch (dbType) {
    case DatabaseType.TURSO:
      return getTursoDatabaseFromEnv();
    case DatabaseType.PG:
      return getPostgresDatabaseFromEnv();
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
    case DatabaseType.PG:
      return getPostgresDatabase(config.connectionString);
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

/**
 * Get a PostgreSQL database instance using environment variables
 */
function getPostgresDatabaseFromEnv() {
  
  // Use DATABASE_URL environment variable for PostgreSQL connection
  const connectionString = process.env.DATABASE_URL || "";
  
  // Use neon for serverless environments or postgres for regular environments
  if (process.env.NODE_ENV === 'production') {
    // For production, use neon with proper configuration for drizzle
    const pool = new Pool({ connectionString });
    return drizzleNeon(pool);
  } else {
    // For development, use postgres-js
    const client = postgres(connectionString);
    return drizzlePg(client);
  }
}

/**
 * Get a PostgreSQL database instance with specific connection parameters
 */
function getPostgresDatabase(connectionString: string) {
  
  // Use neon for serverless environments or postgres for regular environments
  if (process.env.NODE_ENV === 'production') {
    // For production, use neon with proper configuration for drizzle
    const pool = new Pool({ connectionString });
    return drizzleNeon(pool);
  } else {
    // For development, use postgres-js
    const client = postgres(connectionString);
    return drizzlePg(client);
  }
}

// Legacy functions for backward compatibility
export function getWebTursoDBFromEnv(): LibSQLDatabase {
  return getTursoDatabaseFromEnv();
}

export function getWebTursoDB(url: string, authToken: string): LibSQLDatabase {
  return getTursoDatabase(url, authToken);
}
