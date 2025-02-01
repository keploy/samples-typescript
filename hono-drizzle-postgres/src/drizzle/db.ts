import { drizzle } from "drizzle-orm/postgres-js";
import * as schema from './schema.js';
import postgres from "postgres";
import dotenv from "dotenv";

dotenv.config();

const client = postgres(process.env.DATABASE_URL as string);

export const db = drizzle(client, {
    schema,
    logger: true
})