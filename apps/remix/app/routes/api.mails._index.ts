import { LoaderFunction } from "@remix-run/node";
import { getEmailsByMessageTo } from "database/dao";
import { getWebTursoDB } from "database/db";
import { userMailboxCookie } from "../cookies.server";

export const loader: LoaderFunction = async ({ request }) => {
  console.log("[API] Received request for /api/mails at", new Date().toISOString());

  try {
    console.log("[API] Parsing user mailbox from cookie");
    const userMailbox =
      ((await userMailboxCookie.parse(
        request.headers.get("Cookie"),
      )) as string) || undefined;

    if (!userMailbox) {
      console.log("[API] No user mailbox found in cookie, returning empty array");
      return [];
    }

    console.log("[API] User mailbox parsed successfully:", userMailbox);

    const dbUrl = process.env.TURSO_DB_URL as string;
    const dbAuthToken = process.env.TURSO_DB_RO_AUTH_TOKEN as string;

    console.log("[API] Connecting to database with URL:", dbUrl);
    const startDbConnection = Date.now();
    const db = getWebTursoDB(dbUrl, dbAuthToken);
    console.log("[API] Database connection established in", Date.now() - startDbConnection, "ms");

    console.log("[API] Starting to fetch emails for user mailbox:", userMailbox);
    const startFetchEmails = Date.now();
    const mails = await getEmailsByMessageTo(db, userMailbox);
    console.log("[API] Emails fetched successfully in", Date.now() - startFetchEmails, "ms");
    console.log("[API] Total emails fetched:", mails.length);
    
    return mails;
  } catch (error) {
    console.error("[API] Error in /api/mails request:", error);
    return [];
  } finally {
    console.log("[API] Completed /api/mails request at", new Date().toISOString());
  }
};
