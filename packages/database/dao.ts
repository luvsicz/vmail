import { count, desc, eq, and } from "drizzle-orm";
import { drizzle as drizzlePg } from "drizzle-orm/postgres-js";
import { LibSQLDatabase } from "drizzle-orm/libsql";
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
  try {
    console.log(`[DB] insertEmail: inserting email with id=${email.id}, to=${email.messageTo}`);
    
    if (isSQLiteDB(db)) {
      await insertEmailSQLite(db, email);
    } else if (isPostgresDB(db)) {
      await insertEmailPostgres(db, email);
    }
    
    console.log(`[DB] insertEmail: success`);
  } catch (e) {
    console.error(`[DB][ERROR] insertEmail:`, e);
  }
}

async function insertEmailSQLite(db: LibSQLDatabase, email: InsertEmail) {
  await db.insert(sqliteEmails).values(email).execute();
}

async function insertEmailPostgres(db: ReturnType<typeof drizzlePg>, email: InsertEmail) {
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
  try {
    console.log(`[DB] getEmails: fetching all emails`);
    
    let res: any[] = [];
    if (isSQLiteDB(db)) {
      res = await getEmailsSQLite(db);
    } else if (isPostgresDB(db)) {
      res = await getEmailsPostgres(db);
    }
    
    console.log(`[DB] getEmails: fetched ${res.length} emails`);
    return res;
  } catch (e) {
    console.error(`[DB][ERROR] getEmails:`, e);
    return [];
  }
}

async function getEmailsSQLite(db: LibSQLDatabase) {
  return await db.select().from(sqliteEmails).execute();
}

async function getEmailsPostgres(db: ReturnType<typeof drizzlePg>) {
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
  try {
    console.log(`[DB] getEmail: fetching email by id=${id}`);
    
    let result: any[] = [];
    if (isSQLiteDB(db)) {
      result = await getEmailSQLite(db, id);
    } else if (isPostgresDB(db)) {
      result = await getEmailPostgres(db, id);
    }
    
    if (result.length != 1) {
      console.log(`[DB] getEmail: not found or multiple results for id=${id}`);
      return null;
    }
    console.log(`[DB] getEmail: found email for id=${id}`);
    return result[0];
  } catch (e) {
    console.error(`[DB][ERROR] getEmail:`, e);
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

async function getEmailPostgres(db: ReturnType<typeof drizzlePg>, id: string) {
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
  try {
    console.log(`[DB] getEmailByPassword: fetching messageTo by id=${id}`);
    
    let result: any[] = [];
    if (isSQLiteDB(db)) {
      result = await getEmailByPasswordSQLite(db, id);
    } else if (isPostgresDB(db)) {
      result = await getEmailByPasswordPostgres(db, id);
    }
    
    console.log(`[DB] getEmailByPassword: ${result.length ? 'found' : 'not found'} for id=${id}`);
    return result[0];
  } catch (e) {
    console.error(`[DB][ERROR] getEmailByPassword:`, e);
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

async function getEmailByPasswordPostgres(db: ReturnType<typeof drizzlePg>, id: string) {
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
  try {
    console.log(`[DB] getEmailsByMessageTo: fetching emails for to=${messageTo}`);
    
    let res: any[] = [];
    if (isSQLiteDB(db)) {
      res = await getEmailsByMessageToSQLite(db, messageTo);
    } else if (isPostgresDB(db)) {
      res = await getEmailsByMessageToPostgres(db, messageTo);
    }
    
    console.log(`[DB] getEmailsByMessageTo: fetched ${res.length} emails for to=${messageTo}`);
    return res;
  } catch (e) {
    console.error(`[DB][ERROR] getEmailsByMessageTo:`, e);
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

async function getEmailsByMessageToPostgres(db: ReturnType<typeof drizzlePg>, messageTo: string) {
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
  try {
    console.log(`[DB] getEmailsCount: counting all emails`);
    
    let res: any;
    if (isSQLiteDB(db)) {
      res = await getEmailsCountSQLite(db);
    } else if (isPostgresDB(db)) {
      res = await getEmailsCountPostgres(db);
    }
    
    console.log(`[DB] getEmailsCount: count=${res[0]?.count}`);
    return res[0]?.count;
  } catch (e) {
    console.error(`[DB][ERROR] getEmailsCount:`, e);
    return 0;
  }
}

async function getEmailsCountSQLite(db: LibSQLDatabase) {
  return await db.select({ count: count() }).from(sqliteEmails);
}

async function getEmailsCountPostgres(db: ReturnType<typeof drizzlePg>) {
  // Using Drizzle ORM's PostgreSQL API directly
  return await db.select({ count: count() }).from(pgEmails);
}
