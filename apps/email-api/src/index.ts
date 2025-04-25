import { getEmailsByMessageTo } from "database/dao";
import { getDatabaseFromEnv } from "database/db";
import { Context, Hono, Next } from "hono";
import { cors } from "hono/cors";
import * as jose from "jose";
// @ts-ignore
import randomName from "@scaleway/random-name";

type Bindings = {
  JWT_SECRET: string;
  TURNSTILE_SECRET: string;
  EMAIL_DOMAIN: string;
};

type Variables = {
  mailbox: string;
};

const app = new Hono<{ Bindings: Bindings; Variables: Variables }>();

app.use("*", cors());

async function withMailbox(c: Context, next: Next) {
  try {
    console.log(`[EMAIL_API] withMailbox: Checking Authorization header`);
    const authHeader = c.req.header("Authorization");
    if (!authHeader) {
      console.log(`[EMAIL_API][ERROR] Missing Authorization header`);
      return c.json({ error: "Missing Authorization header" }, 401);
    }
    const token = authHeader.split(" ")[1];
    const { payload } = await jose.jwtVerify(token, c.env.JWT_SECRET);
    console.log(`[EMAIL_API] withMailbox: mailbox extracted: ${payload.mailbox}`);
    c.set("mailbox", payload.mailbox);
    return next();
  } catch (e) {
    console.log(`[EMAIL_API][ERROR] withMailbox: ${e instanceof Error ? e.message : String(e)}`);
    return c.json({ error: "Failed to verify" }, 400);
  }
}

async function withTurnstile(c: Context, next: Next) {
  try {
    console.log(`[EMAIL_API] withTurnstile: Checking cf-turnstile-response`);
    let token: string | undefined;
    switch (c.req.header("content-type")) {
      case "application/x-www-form-urlencoded":
      case "multipart/form-data":
        token =
          (await c.req.formData()).get("cf-turnstile-response") || undefined;
      case "application/json":
        token = (await c.req.json())["cf-turnstile-response"] || undefined;
      default:
        token = c.req.query("cf-turnstile-response");
    }
    if (!token || typeof token !== "string") {
      console.log(`[EMAIL_API][ERROR] withTurnstile: Missing cf-turnstile-response`);
      return c.json({ error: "Missing cf-turnstile-response" }, 400);
    }
    const res = await fetch(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      {
        method: "POST",
        body: `secret=${encodeURIComponent(
          c.env.TURNSTILE_SECRET
        )}&response=${encodeURIComponent(token)}`,
        headers: {
          "content-type": "application/x-www-form-urlencoded",
        },
      }
    );
    if (!res.ok) {
      console.log(`[EMAIL_API][ERROR] withTurnstile: Cloudflare siteverify failed`);
      return c.json({ error: "Failed to verify" }, 400);
    }
    const json = (await res.json()) as { success: boolean };
    if (!json.success) {
      console.log(`[EMAIL_API][ERROR] withTurnstile: Verification not successful`);
      return c.json({ error: "Failed to verify" }, 400);
    }
    console.log(`[EMAIL_API] withTurnstile: Verification successful`);
    return next();
  } catch (e) {
    console.log(`[EMAIL_API][ERROR] withTurnstile: ${e instanceof Error ? e.message : String(e)}`);
    return c.json({ error: "Failed to verify" }, 400);
  }
}

app.post("/mailbox", withTurnstile, async (c) => {
  console.log(`[EMAIL_API] POST /mailbox: Creating mailbox and JWT`);
  const jwtSecret = new TextEncoder().encode(c.env.JWT_SECRET);
  const name = randomName("", ".");
  const domain = c.env.EMAIL_DOMAIN || "";
  const mailbox = `${name}@${domain}`;
  const token = await new jose.SignJWT({ mailbox })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("2h")
    .sign(jwtSecret);
  console.log(`[EMAIL_API] POST /mailbox: mailbox=${mailbox}`);
  return c.json({ mailbox, token });
});

app.get("/mails", withMailbox, async (c) => {
  const mailbox = c.get("mailbox");
  console.log(`[EMAIL_API] GET /mails: mailbox=${mailbox}`);
  // Use the new database API with explicit database type
  const db = getDatabaseFromEnv();
  const mails = await getEmailsByMessageTo(db, mailbox);
  console.log(`[EMAIL_API] GET /mails: found ${mails.length} mails`);
  return c.json(mails);
});

export default app;
