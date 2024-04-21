import { drizzle } from 'drizzle-orm/postgres-js'
import * as postgres from 'postgres'

require('dotenv').config()

const connectionString = process.env.DATABASE_URL

const client = postgres(connectionString)
export const db = drizzle(client);