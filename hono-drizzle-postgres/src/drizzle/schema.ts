
import { integer, pgTable, uuid, varchar,boolean } from "drizzle-orm/pg-core";

export const usersTable = pgTable("users", {
    id: uuid().primaryKey().defaultRandom(),
    name: varchar({ length: 255 }).notNull(),
    password: varchar({ length: 255 }).notNull(),
    email: varchar({ length: 255 }).notNull().unique(),
});




export const todoTable = pgTable("todo", {
    id: uuid().primaryKey().defaultRandom(),
    title: varchar({ length: 255 }).notNull(),
    description: varchar({ length: 255 }).notNull(),
    createdBy: uuid('createdBy').notNull().references(() => usersTable.id),
    completed: boolean().notNull().default(false),
});

