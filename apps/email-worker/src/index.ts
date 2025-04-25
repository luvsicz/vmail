import { ForwardableEmailMessage } from '@cloudflare/workers-types';
import { insertEmail } from 'database/dao';
import { DatabaseType, getDatabase, getDatabaseFromEnv } from 'database/db';
import { InsertEmail, insertEmailSchema } from 'database/schema';
import { nanoid } from 'nanoid/non-secure';
import PostalMime from 'postal-mime';
export interface Env {
	DB: D1Database;
	DATABASE_TYPE: string;
	DATABASE_URL: string;
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
			
			// Determine database type from environment variable
			const dbType = (env.DATABASE_TYPE || 'turso').toLowerCase();
			console.log(`[EMAIL_WORKER] Using database type: ${dbType}`);
			
			let db;
			if (dbType === DatabaseType.PG) {
				// Use PostgreSQL database
				if (!env.DATABASE_URL) {
					throw new Error('DATABASE_URL environment variable not set for PG database type');
				}
				db = getDatabase(DatabaseType.PG, {
					connectionString: env.DATABASE_URL
				});
				console.log(`[EMAIL_WORKER] PostgreSQL DB connection established`);
			} else {
				// Default to Turso database
				if (!env.TURSO_DB_URL || !env.TURSO_DB_AUTH_TOKEN) {
					throw new Error('TURSO_DB_URL or TURSO_DB_AUTH_TOKEN environment variable not set for Turso database type');
				}
				db = getDatabase(DatabaseType.TURSO, {
					url: env.TURSO_DB_URL,
					authToken: env.TURSO_DB_AUTH_TOKEN
				});
				console.log(`[EMAIL_WORKER] Turso DB connection established`);
			}

			// Convert replyTo field from object to array if it is an object
			if (mail.replyTo && !Array.isArray(mail.replyTo)) {
				console.log(`[EMAIL_WORKER] Normalizing replyTo field to array`);
				mail.replyTo = [mail.replyTo];
			}

			// Ensure we have required properties for the email object
			// mail from PostalMime may not have all the required fields
			const newEmail: InsertEmail = {
				id: nanoid(),
				messageFrom,
				messageTo,
				headers: mail.headers || [],
				from: mail.from || { address: messageFrom, name: messageFrom },
				// Add other required fields explicitly to ensure type safety
				messageId: mail.messageId || `${nanoid()}@vmail.generated`,
				// Optional fields from mail
				sender: mail.sender || null,
				replyTo: mail.replyTo || [],
				deliveredTo: mail.deliveredTo || null,
				returnPath: mail.returnPath || null,
				to: mail.to || [],
				cc: mail.cc || [],
				bcc: mail.bcc || [],
				subject: mail.subject || null,
				inReplyTo: mail.inReplyTo || null,
				references: mail.references || null,
				date: mail.date || null,
				html: mail.html || null,
				text: mail.text || null,
				createdAt: now,
				updatedAt: now,
			};
			console.log(`[EMAIL_WORKER] New email object created with id: ${newEmail.id}`);
			// Parse and validate the email object
			const validatedEmail = insertEmailSchema.parse(newEmail);
			console.log(`[EMAIL_WORKER] Email object passed schema validation`);
			
			// Ensure all optional fields are explicitly null instead of undefined
			// to match the Email type expected by insertEmail
			const emailForDb: any = {
				...validatedEmail,
				// Make sure optional fields that could be undefined are explicitly null
				date: validatedEmail.date ?? null,
				html: validatedEmail.html ?? null,
				text: validatedEmail.text ?? null,
				inReplyTo: validatedEmail.inReplyTo ?? null,
				references: validatedEmail.references ?? null,
				deliveredTo: validatedEmail.deliveredTo ?? null,
				returnPath: validatedEmail.returnPath ?? null,
				// Optional array fields should be empty arrays instead of undefined
				to: validatedEmail.to ?? [],
				cc: validatedEmail.cc ?? [],
				bcc: validatedEmail.bcc ?? [],
				replyTo: validatedEmail.replyTo ?? []
			};
			
			await insertEmail(db, emailForDb);
			console.log(`[EMAIL_WORKER] Email inserted into database: ${newEmail.id}`);
		} catch (e) {
			console.log(`[EMAIL_WORKER][ERROR] ${e instanceof Error ? e.message : String(e)}`);
		}
	},

};
