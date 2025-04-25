import { count, desc, eq, and } from "drizzle-orm";
import { drizzle as drizzlePg } from "drizzle-orm/postgres-js";
import { LibSQLDatabase } from "drizzle-orm/libsql";
import { type NeonDatabase } from "drizzle-orm/neon-serverless";
import { DrizzleDB, isPostgresDB, isSQLiteDB } from "./db";
import { emails as sqliteEmails, InsertEmail } from "./schema";
import { emails as pgEmails } from "./schema.pg";

/**
 * Inserts a new email into the database
 * 
 * @param db Database instance
 * @param email Email data to insert
 */
export async function insertEmail(db: DrizzleDB, email: InsertEmail) {
  const startTime = performance.now();
  try {
    console.log(`[DB] insertEmail: starting operation - id=${email.id}, to=${email.messageTo}`);
    
    if (isSQLiteDB(db)) {
      await insertEmailSQLite(db, email);
    } else if (isPostgresDB(db)) {
      await insertEmailPostgres(db, email);
    }
    
    const duration = (performance.now() - startTime).toFixed(2);
    console.log(`[DB] insertEmail: success - duration=${duration}ms`);
  } catch (e) {
    const duration = (performance.now() - startTime).toFixed(2);
    console.error(`[DB][ERROR] insertEmail: failed after ${duration}ms -`, e);
  }
}

async function insertEmailSQLite(db: LibSQLDatabase, email: InsertEmail) {
  await db.insert(sqliteEmails).values(email).execute();
}

async function insertEmailPostgres(db: ReturnType<typeof drizzlePg> | NeonDatabase, email: InsertEmail) {
  // Using Drizzle ORM's PostgreSQL API directly
  await db.insert(pgEmails).values(email as any).execute();
}

/**
 * Retrieves all emails from the database
 * 
 * @param db Database instance
 * @returns Array of all emails
 */
export async function getEmails(db: DrizzleDB) {
  const startTime = performance.now();
  try {
    console.log(`[DB] getEmails: starting operation`);
    
    let res: any[] = [];
    if (isSQLiteDB(db)) {
      res = await getEmailsSQLite(db);
    } else if (isPostgresDB(db)) {
      res = await getEmailsPostgres(db);
    }
    
    const duration = (performance.now() - startTime).toFixed(2);
    console.log(`[DB] getEmails: fetched ${res.length} emails - duration=${duration}ms`);
    return res;
  } catch (e) {
    const duration = (performance.now() - startTime).toFixed(2);
    console.error(`[DB][ERROR] getEmails: failed after ${duration}ms -`, e);
    return [];
  }
}

async function getEmailsSQLite(db: LibSQLDatabase) {
  return await db.select().from(sqliteEmails).execute();
}

async function getEmailsPostgres(db: ReturnType<typeof drizzlePg> | NeonDatabase) {
  return await db.select().from(pgEmails).execute();
}

/**
 * Retrieves a single email by ID
 * 
 * @param db Database instance
 * @param id Email ID
 * @returns Email object or null if not found
 */
export async function getEmail(db: DrizzleDB, id: string) {
  const startTime = performance.now();
  try {
    console.log(`[DB] getEmail: starting operation - id=${id}`);
    
    let result: any[] = [];
    if (isSQLiteDB(db)) {
      result = await getEmailSQLite(db, id);
    } else if (isPostgresDB(db)) {
      result = await getEmailPostgres(db, id);
    }
    
    const duration = (performance.now() - startTime).toFixed(2);
    if (result.length != 1) {
      console.log(`[DB] getEmail: not found or multiple results for id=${id} - duration=${duration}ms`);
      return null;
    }
    console.log(`[DB] getEmail: found email for id=${id} - duration=${duration}ms`);
    return result[0];
  } catch (e) {
    const duration = (performance.now() - startTime).toFixed(2);
    console.error(`[DB][ERROR] getEmail: failed after ${duration}ms -`, e);
    return null;
  }
}

async function getEmailSQLite(db: LibSQLDatabase, id: string) {
  return await db
    .select()
    .from(sqliteEmails)
    .where(eq(sqliteEmails.id, id))
    .execute();
}

async function getEmailPostgres(db: ReturnType<typeof drizzlePg> | NeonDatabase, id: string) {
  // Using Drizzle ORM's PostgreSQL API directly
  return await db
    .select()
    .from(pgEmails)
    .where(eq(pgEmails.id as any, id))
    .execute();
}

/**
 * Retrieves email recipient by ID
 * 
 * @param db Database instance
 * @param id Email ID
 * @returns Object containing messageTo field or null if not found
 */
export async function getEmailByPassword(db: DrizzleDB, id: string) {
  const startTime = performance.now();
  try {
    console.log(`[DB] getEmailByPassword: starting operation - id=${id}`);
    
    let result: any[] = [];
    if (isSQLiteDB(db)) {
      result = await getEmailByPasswordSQLite(db, id);
    } else if (isPostgresDB(db)) {
      result = await getEmailByPasswordPostgres(db, id);
    }
    
    const duration = (performance.now() - startTime).toFixed(2);
    console.log(`[DB] getEmailByPassword: ${result.length ? 'found' : 'not found'} for id=${id} - duration=${duration}ms`);
    return result[0];
  } catch (e) {
    const duration = (performance.now() - startTime).toFixed(2);
    console.error(`[DB][ERROR] getEmailByPassword: failed after ${duration}ms -`, e);
    return null;
  }
}

async function getEmailByPasswordSQLite(db: LibSQLDatabase, id: string) {
  return await db
    .select({ messageTo: sqliteEmails.messageTo })
    .from(sqliteEmails)
    .where(eq(sqliteEmails.id, id))
    .limit(1)
    .execute();
}

async function getEmailByPasswordPostgres(db: ReturnType<typeof drizzlePg> | NeonDatabase, id: string) {
  // Using Drizzle ORM's PostgreSQL API directly
  return await db
    .select({ messageTo: pgEmails.messageTo })
    .from(pgEmails)
    .where(eq(pgEmails.id as any, id))
    .limit(1)
    .execute();
}

/**
 * Retrieves all emails addressed to a specific recipient
 * 
 * @param db Database instance
 * @param messageTo Email recipient
 * @returns Array of emails
 */
export async function getEmailsByMessageTo(
  db: DrizzleDB,
  messageTo: string
) {
  const startTime = performance.now();
  try {
    console.log(`[DB] getEmailsByMessageTo: starting operation - to=${messageTo}`);
    
    let res: any[] = [];
    if (isSQLiteDB(db)) {
      res = await getEmailsByMessageToSQLite(db, messageTo);
    } else if (isPostgresDB(db)) {
      res = await getEmailsByMessageToPostgres(db, messageTo);
    }
    
    const duration = (performance.now() - startTime).toFixed(2);
    console.log(`[DB] getEmailsByMessageTo: fetched ${res.length} emails for to=${messageTo} - duration=${duration}ms`);
    return res;
  } catch (e) {
    const duration = (performance.now() - startTime).toFixed(2);
    console.error(`[DB][ERROR] getEmailsByMessageTo: failed after ${duration}ms -`, e);
    return [];
  }
}

async function getEmailsByMessageToSQLite(db: LibSQLDatabase, messageTo: string) {
  return await db
    .select()
    .from(sqliteEmails)
    .where(eq(sqliteEmails.messageTo, messageTo))
    .orderBy(desc(sqliteEmails.createdAt))
    .execute();
}

async function getEmailsByMessageToPostgres(db: ReturnType<typeof drizzlePg> | NeonDatabase, messageTo: string) {
  // Using Drizzle ORM's PostgreSQL API directly
  return await db
    .select()
    .from(pgEmails)
    .where(eq(pgEmails.messageTo as any, messageTo))
    .orderBy(desc(pgEmails.createdAt as any))
    .execute();
}

/**
 * Gets the total count of emails in the database
 * 
 * @param db Database instance
 * @returns Number of emails
 */
export async function getEmailsCount(db: DrizzleDB) {
  const startTime = performance.now();
  try {
    console.log(`[DB] getEmailsCount: starting operation`);
    
    let res: any;
    if (isSQLiteDB(db)) {
      res = await getEmailsCountSQLite(db);
    } else if (isPostgresDB(db)) {
      res = await getEmailsCountPostgres(db);
    }
    
    const duration = (performance.now() - startTime).toFixed(2);
    console.log(`[DB] getEmailsCount: count=${res[0]?.count} - duration=${duration}ms`);
    return res[0]?.count;
  } catch (e) {
    const duration = (performance.now() - startTime).toFixed(2);
    console.error(`[DB][ERROR] getEmailsCount: failed after ${duration}ms -`, e);
    return 0;
  }
}

async function getEmailsCountSQLite(db: LibSQLDatabase) {
  return await db.select({ count: count() }).from(sqliteEmails);
}

async function getEmailsCountPostgres(db: ReturnType<typeof drizzlePg> | NeonDatabase) {
  // Using Drizzle ORM's PostgreSQL API directly
  return await db.select({ count: count() }).from(pgEmails);
}
