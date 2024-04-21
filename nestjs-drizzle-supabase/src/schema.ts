import { serial, text, timestamp, pgTable, integer, uuid } from "drizzle-orm/pg-core";

export const product = pgTable('product', {
  id: uuid('id').primaryKey(),
  name: text("name"),
  description: text("description"),
  cost: integer("cost"),
});