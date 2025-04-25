import * as orm from "drizzle-orm";
import * as z from "zod";

// Import types and schemas from schema.ts
import {
  Address,
  AddressSchema,
  Email,
  Header,
  InsertEmail,
  emails,
  insertEmailSchema
} from "./schema";

// Import database functions from db.ts
import {
  DatabaseType,
  DrizzleDB,
  getDatabase,
  getDatabaseFromEnv,
  getWebTursoDB,
  getWebTursoDBFromEnv
} from "./db";

// Re-export everything
export {
  // Types and schemas
  Address,
  AddressSchema,
  Email,
  Header,
  InsertEmail,
  emails,
  insertEmailSchema,
  
  // Database utility functions
  getDatabase,
  getDatabaseFromEnv,
  getWebTursoDB,
  getWebTursoDBFromEnv,
  
  // Database types
  DatabaseType,
  DrizzleDB,
  
  // ORM and validation libraries
  orm,
  z,
};
