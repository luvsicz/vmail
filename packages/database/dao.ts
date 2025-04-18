import { count, desc, eq, and } from "drizzle-orm";
import { LibSQLDatabase } from "drizzle-orm/libsql";
import { emails, InsertEmail } from "./schema";

export async function insertEmail(db: LibSQLDatabase, email: InsertEmail) {
  try {
    await db.insert(emails).values(email).execute();
  } catch (e) {
    console.error(e);
  }
}

export async function getEmails(db: LibSQLDatabase) {
  try {
    return await db.select().from(emails).execute();
  } catch (e) {
    return [];
  }
}

export async function getEmail(db: LibSQLDatabase, id: string) {
  try {
    const result = await db
      .select()
      .from(emails)
      .where(and(eq(emails.id, id)))
      .execute();
    if (result.length != 1) {
      return null;
    }
    return result[0];
  } catch (e) {
    return null;
  }
}

export async function getEmailByPassword(db: LibSQLDatabase, id: string) {
  console.log("[DB] Starting getEmailByPassword query for id:", id);
  const startTime = Date.now();
  try {
    const result = await db
      .select({ messageTo: emails.messageTo })
      .from(emails)
      .where(and(eq(emails.id, id)))
      .limit(1)
      .execute();
    
    const duration = Date.now() - startTime;
    console.log("[DB] getEmailByPassword query completed in", duration, "ms");
    if (result.length === 0) {
      console.log("[DB] No email found for the provided password");
    } else {
      console.log("[DB] Email found for password, messageTo:", result[0]?.messageTo);
    }
    
    return result[0];
  } catch (e) {
    const duration = Date.now() - startTime;
    console.error("[DB] Error in getEmailByPassword after", duration, "ms:", e);
    return null;
  }
}

export async function getEmailsByMessageTo(
  db: LibSQLDatabase,
  messageTo: string
) {
  console.log("[DB] Starting getEmailsByMessageTo query for:", messageTo);
  const startTime = Date.now();
  try {
    const result = await db
      .select()
      .from(emails)
      .where(eq(emails.messageTo, messageTo))
      .orderBy(desc(emails.createdAt))
      .execute();
    
    const duration = Date.now() - startTime;
    console.log("[DB] getEmailsByMessageTo query completed in", duration, "ms");
    console.log("[DB] Returned", result.length, "emails");
    
    return result;
  } catch (e) {
    const duration = Date.now() - startTime;
    console.error("[DB] Error in getEmailsByMessageTo after", duration, "ms:", e);
    return [];
  }
}

export async function getEmailsCount(db: LibSQLDatabase) {
  try {
    const res = await db.select({ count: count() }).from(emails);
    return res[0]?.count;
  } catch (e) {
    return 0;
  }
}
