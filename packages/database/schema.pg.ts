import { pgTable, text, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import * as z from "zod";

export type Header = Record<string, string>;

export type Address = {
  address: string;
  name: string;
};

export type Email = typeof emails.$inferSelect;

export const emails = pgTable("emails", {
  id: text("id").primaryKey(),
  messageFrom: text("message_from").notNull(),
  messageTo: text("message_to").notNull(),
  headers: jsonb("headers").notNull().$type<Header[]>(),
  from: jsonb("from").notNull().$type<Address>(),
  sender: jsonb("sender").$type<Address>(),
  replyTo: jsonb("reply_to").$type<Address[]>(),
  deliveredTo: text("delivered_to"),
  returnPath: text("return_path"),
  to: jsonb("to").$type<Address[]>(),
  cc: jsonb("cc").$type<Address[]>(),
  bcc: jsonb("bcc").$type<Address[]>(),
  subject: text("subject"),
  messageId: text("message_id").notNull(),
  inReplyTo: text("in_reply_to"),
  references: text("references"),
  date: text("date"),
  html: text("html"),
  text: text("text"),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
});

export const AddressSchema = z.object({
  address: z.string(),
  name: z.string(),
});

// Create a schema for validation, but use a type assertion to work around type issues
export const insertEmailSchema = createInsertSchema(emails as any, {
  headers: z.array(z.record(z.string())),
  from: AddressSchema,
  sender: AddressSchema.optional(),
  replyTo: z.array(AddressSchema).optional(),
  to: z.array(AddressSchema).optional(),
  cc: z.array(AddressSchema).optional(),
  bcc: z.array(AddressSchema).optional(),
});

export type InsertEmail = z.infer<typeof insertEmailSchema>;
