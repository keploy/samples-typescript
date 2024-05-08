import {drizzle } from "drizzle-orm/postgres-js"
import postgres from "postgres"
import { migrate } from "drizzle-orm/postgres-js/migrator";
import * as schema from '../schemas/user';


const client = postgres(process.env.DATABASE_URL ?? "")
const db = drizzle(client,{schema})

// const migrationClient = postgres('postgresql://postgres:password@localhost:5432/postgres', { max: 1 });
// migrate(drizzle(migrationClient),{ migrationsFolder: "./drizzle" })

// console.log("Migrations Run SuccessFully")

export default db
// import {drizzle } from "drizzle-orm/postgres-js"
// import postgres from "postgres"


// const client = postgres(process.env.DATABASE_URL ?? "")
// const db = drizzle(client)

// export default db

// // import { sql } from "@vercel/postgres";
// import postgres from "postgres";
// import {
//   drizzle as VercelDrizzle,
//   type VercelPgDatabase,
// } from "drizzle-orm/vercel-postgres";
// import {
//   drizzle as LocalDrizzle,
//   type PostgresJsDatabase,
// } from "drizzle-orm/postgres-js";

// let db:
//   | VercelPgDatabase<Record<string, never>>
//   | PostgresJsDatabase<Record<string, never>>;
// if (process.env.NODE_ENV === "production") {
//   db = VercelDrizzle(sql);
// } else {
//   const migrationClient = postgres(process.env.POSTGRES_URL as string);
//   db = LocalDrizzle(migrationClient);
// }

// export default db ;
