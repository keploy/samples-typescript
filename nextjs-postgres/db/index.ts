import {drizzle } from "drizzle-orm/postgres-js"
import postgres from "postgres"
import { migrate } from "drizzle-orm/postgres-js/migrator";
import * as schema from '../schemas/user';


const client = postgres(process.env.DATABASE_URL ?? "")
const db = drizzle(client,{schema})

const migrationClient = postgres('postgresql://postgres:password@localhost:5432/postgres', { max: 1 });
migrate(drizzle(migrationClient),{ migrationsFolder: "./drizzle" })

console.log("Migrations Run SuccessFully")

export default db