import { LoaderFunction } from "@remix-run/node";
import { getEmailsByMessageTo } from "database/dao";
import { DatabaseType, getDatabase, getDatabaseFromEnv } from "database/db";
import { userMailboxCookie } from "../cookies.server";

export const loader: LoaderFunction = async ({ request }) => {
  const userMailbox =
    ((await userMailboxCookie.parse(
      request.headers.get("Cookie"),
    )) as string) || undefined;
  if (!userMailbox) {
    return [];
  }
  
  // Use the new database API with explicit database type
  const db = getDatabaseFromEnv();
  
  const mails = await getEmailsByMessageTo(db, userMailbox);
  return mails;
};
