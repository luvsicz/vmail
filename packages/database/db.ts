import { createClient as createWebClient } from "@libsql/client/web";
import { drizzle, LibSQLDatabase } from "drizzle-orm/libsql";

export function getWebTursoDBFromEnv(): LibSQLDatabase {
  const client = createWebClient({
    url: process.env.TURSO_DB_URL || "",
    authToken: process.env.TURSO_DB_AUTH_TOKEN || "",
  });
  return drizzle(client);
}

export function getWebTursoDB(url: string, authToken: string): LibSQLDatabase {
  console.log("[DB Connection] Creating database client with URL:", url);
  const startTime = Date.now();
  try {
    const client = createWebClient({ url, authToken });
    const db = drizzle(client);
    console.log("[DB Connection] Database client created successfully in", Date.now() - startTime, "ms");
    return db;
  } catch (error) {
    console.error("[DB Connection] Error creating database client after", Date.now() - startTime, "ms:", error);
    throw error; // Re-throw to allow proper error handling upstream
  }
}
