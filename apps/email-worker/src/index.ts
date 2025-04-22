import { ForwardableEmailMessage } from '@cloudflare/workers-types';
import { insertEmail } from 'database/dao';
import { getWebTursoDB } from 'database/db';
import { InsertEmail, insertEmailSchema } from 'database/schema';
import { nanoid } from 'nanoid/non-secure';
import PostalMime from 'postal-mime';
export interface Env {
	DB: D1Database;
	TURSO_DB_URL: string;
	TURSO_DB_AUTH_TOKEN: string;
}

export default {
	async email(message: ForwardableEmailMessage, env: Env, ctx: ExecutionContext): Promise<void> {
		try {
			console.log(`[EMAIL_WORKER] Received email from: ${message.from} to: ${message.to}`);
			const messageFrom = message.from;
			const messageTo = message.to;
			const rawText = await new Response(message.raw).text();
			console.log(`[EMAIL_WORKER] Raw email text length: ${rawText.length}`);
			const mail = await new PostalMime().parse(rawText);
			console.log(`[EMAIL_WORKER] Parsed subject: ${mail.subject || '(none)'}`);
			const now = new Date();
			const db = getWebTursoDB(env.TURSO_DB_URL, env.TURSO_DB_AUTH_TOKEN);
			console.log(`[EMAIL_WORKER] DB connection established`);

			// Convert replyTo field from object to array if it is an object
			if (mail.replyTo && !Array.isArray(mail.replyTo)) {
				console.log(`[EMAIL_WORKER] Normalizing replyTo field to array`);
				mail.replyTo = [mail.replyTo];
			}

			const newEmail: InsertEmail = {
				id: nanoid(),
				messageFrom,
				messageTo,
				...mail,
				createdAt: now,
				updatedAt: now,
			};
			console.log(`[EMAIL_WORKER] New email object created with id: ${newEmail.id}`);
			const email = insertEmailSchema.parse(newEmail);
			console.log(`[EMAIL_WORKER] Email object passed schema validation`);
			await insertEmail(db, email);
			console.log(`[EMAIL_WORKER] Email inserted into database: ${newEmail.id}`);
		} catch (e) {
			console.log(`[EMAIL_WORKER][ERROR] ${e instanceof Error ? e.message : String(e)}`);
		}
	},
};
