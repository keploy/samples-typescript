// import "dotenv/config";
// import { migrate } from "drizzle-orm/postgres-js/migrator";
// import postgres from "postgres";
// import { sql } from "@vercel/postgres";
// import { drizzle as VercelDrizzle } from "drizzle-orm/vercel-postgres";
// import { drizzle as LocalDrizzle } from "drizzle-orm/postgres-js";

// // Could not import from drizzle.ts due to mts v ts compatibility issues
// let db;
// if (process.env.NODE_ENV === "production") {
//   db = VercelDrizzle(sql);
//   migrate(db, { migrationsFolder: "./db/migrations" });
// } else {
//   const migrationClient = postgres(process.env.POSTGRES_URL as string, {
//     max: 1,
//   });
//   db = LocalDrizzle(migrationClient);
//   await migrate(db, { migrationsFolder: "./db/migrations" });
//   await migrationClient.end();
// }
