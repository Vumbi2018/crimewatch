import { config } from "dotenv";
import { drizzle as drizzleNeon } from "drizzle-orm/neon-serverless";
import { drizzle as drizzleNodePostgres } from "drizzle-orm/node-postgres";
import ws from "ws";
import * as schema from "@shared/schema";

config();

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL must be set. Did you forget to provision a database?");
}

const databaseUrl = process.env.DATABASE_URL;
const isLocalPostgres =
  databaseUrl.includes("localhost") ||
  databaseUrl.includes("127.0.0.1") ||
  databaseUrl.includes("host.docker.internal");

let db: any;

if (isLocalPostgres) {
  const { Pool } = require("pg") as {
    Pool: new (config: { connectionString: string }) => unknown;
  };
  const pool = new Pool({ connectionString: databaseUrl });

  console.log("Using node-postgres database driver for local DATABASE_URL");
  db = drizzleNodePostgres(pool as never, { schema });
} else {
  console.log("Using Neon serverless database driver");
  db = drizzleNeon({
    connection: databaseUrl,
    schema,
    ws: ws,
  });
}

export { db };