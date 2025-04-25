import { count, desc, eq, and } from "drizzle-orm";
import { DrizzleDB } from "./db";
import { emails, InsertEmail } from "./schema";

/**
 * Inserts a new email into the database
 * 
 * @param db Database instance
 * @param email Email data to insert
 */
export async function insertEmail(db: DrizzleDB, email: InsertEmail) {
  try {
    console.log(`[DB] insertEmail: inserting email with id=${email.id}, to=${email.messageTo}`);
    await db.insert(emails).values(email).execute();
    console.log(`[DB] insertEmail: success`);
  } catch (e) {
    console.error(`[DB][ERROR] insertEmail:`, e);
  }
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
    const res = await db.select().from(emails).execute();
    console.log(`[DB] getEmails: fetched ${res.length} emails`);
    return res;
  } catch (e) {
    console.error(`[DB][ERROR] getEmails:`, e);
    return [];
  }
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
    const result = await db
      .select()
      .from(emails)
      .where(and(eq(emails.id, id)))
      .execute();
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
    const result = await db
      .select({ messageTo: emails.messageTo })
      .from(emails)
      .where(and(eq(emails.id, id)))
      .limit(1)
      .execute();
    console.log(`[DB] getEmailByPassword: ${result.length ? 'found' : 'not found'} for id=${id}`);
    return result[0];
  } catch (e) {
    console.error(`[DB][ERROR] getEmailByPassword:`, e);
    return null;
  }
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
    const res = await db
      .select()
      .from(emails)
      .where(eq(emails.messageTo, messageTo))
      .orderBy(desc(emails.createdAt))
      .execute();
    console.log(`[DB] getEmailsByMessageTo: fetched ${res.length} emails for to=${messageTo}`);
    return res;
  } catch (e) {
    console.error(`[DB][ERROR] getEmailsByMessageTo:`, e);
    return [];
  }
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
    const res = await db.select({ count: count() }).from(emails);
    console.log(`[DB] getEmailsCount: count=${res[0]?.count}`);
    return res[0]?.count;
  } catch (e) {
    console.error(`[DB][ERROR] getEmailsCount:`, e);
    return 0;
  }
}
