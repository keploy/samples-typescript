import {
    pgTable,
    serial,
    text,
    varchar,
    timestamp,
    uniqueIndex
} from 'drizzle-orm/pg-core'

import { InferModel } from 'drizzle-orm'

export const users = pgTable("users", {
    id: serial("id").primaryKey(),
    name: text("name").notNull(),
    email: varchar("email", {length: 256}).notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull()
},
(users) => {
    return {
        uniqueIdx: uniqueIndex("unique_idx").on(users.email),
    }
}
)

export type User = InferModel<typeof users>
export type NewUser = InferModel<typeof users, "insert">