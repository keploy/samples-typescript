import { config } from 'dotenv';
import 'dotenv/config';
import { defineConfig } from 'drizzle-kit';


config(
    {
        path: './.env',
    }
)

export default defineConfig({
    schema: './src/drizzle/schema.ts',
    out: './src/drizzle/migrations',
    dialect: 'postgresql',
    dbCredentials: {
        url: process.env.DATABASE_URL!,
    },
    verbose: true,
    strict: true,
});
