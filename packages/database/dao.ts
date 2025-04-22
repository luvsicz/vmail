import { count, desc, eq, and } from "drizzle-orm";
import { LibSQLDatabase } from "drizzle-orm/libsql";
import { emails, InsertEmail } from "./schema";

export async function insertEmail(db: LibSQLDatabase, email: InsertEmail) {
  try {
    console.log(`[DB] insertEmail: inserting email with id=${email.id}, to=${email.messageTo}`);
    await db.insert(emails).values(email).execute();
    console.log(`[DB] insertEmail: success`);
  } catch (e) {
    console.error(`[DB][ERROR] insertEmail:`, e);
  }
}

export async function getEmails(db: LibSQLDatabase) {
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

export async function getEmail(db: LibSQLDatabase, id: string) {
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

export async function getEmailByPassword(db: LibSQLDatabase, id: string) {
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

export async function getEmailsByMessageTo(
  db: LibSQLDatabase,
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

export async function getEmailsCount(db: LibSQLDatabase) {
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
