import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { env } from "#/lib/env";
import * as schema from "./schema.ts";

// Use Neon's serverless HTTP driver (no native pg dependency)
const sql = neon(env.DATABASE_URL);
export const db = drizzle(sql, { schema });
