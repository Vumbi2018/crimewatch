import { drizzle } from "drizzle-orm/neon-serverless";
import ws from "ws";
import * as schema from "@shared/schema";

const dbUrl = process.env.SHARED_DATABASE_URL || process.env.DATABASE_URL;

if (!dbUrl) {
  throw new Error("DATABASE_URL must be set. Did you forget to provision a database?");
}

export const db = drizzle({
  connection: dbUrl,
  schema,
  ws: ws,
});
