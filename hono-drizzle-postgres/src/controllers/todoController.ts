import type { Context } from "hono";
import { todoTable } from "../drizzle/schema.js";
import { db } from "../drizzle/db.js";
import { eq } from "drizzle-orm";



interface todoType {
    title: string;
    description: string;
    completed: boolean;
}

export const addTodo = async (c: Context) => {
    try {
        const { title, description }: todoType = await c.req.json();

        if (!title || !description) {
            return c.json({ error: "All fields are required" }, 400);
        }

        const createdBy = c.get("userId");

        const todo = await db.insert(todoTable).values({
            title,
            description,
            createdBy,
            completed: false
        })

        if (!todo) {
            return c.json({ error: "Failed to add todo" }, 500);
        }

        return c.json({
            message: "Todo added successfully",
            data: {
                title,
                description
            }
        }, 201);


    } catch (error) {
        console.log(error);
        return c.json({ error: "Error adding todo" }, 500);
    }
}

export const toggleTodoStatus = async (c: Context) => {
    try {
        const todoId = c.req.queries('todoId')?.[0];


        if (!todoId) {
            return c.json({ error: "Todo ID is required" }, 400);
        }

        const existingTodo = await db.select().from(todoTable).where(eq(todoTable.id, todoId));

        if (!existingTodo) {
            return c.json({ error: "Todo not found" }, 404);
        }

        const updatedTodo = await db
            .update(todoTable)
            .set({
                completed: !existingTodo[0].completed
            })
            .where(eq(todoTable.id, todoId));



        const getUpdatedTodo = await db.select().from(todoTable).where(eq(todoTable.id, todoId));

        if (!updatedTodo) {
            return c.json({ error: "Failed to update todo" }, 500);
        }

        return c.json({
            message: "Todo status updated successfully",
            data: {
                getUpdatedTodo
            }
        }, 200);
    } catch (error) {
        console.log(error);
        return c.json({ error: "Error updating todo" }, 500);

    }
}



export const getTodos = async (c: Context) => {
    try {
        const createdBy = c.get("userId");

        const todos = await db.select().from(todoTable).where(eq(todoTable.createdBy, createdBy));

        return c.json({
            message: "Todos fetched successfully",
            data: {
                todos
            }
        }, 200);
    } catch (error) {
        console.log(error);
        return c.json({ error: "Error fetching todos" }, 500);

    }
}


export const deleteTodo = async (c: Context) => {
    try {
        const todoId = c.req.queries('todoId')?.[0];

        if (!todoId) {
            return c.json({ error: "Todo ID is required" }, 400);
        }

        const existingTodo = await db.select().from(todoTable).where(eq(todoTable.id, todoId));

        if (!existingTodo) {
            return c.json({ error: "Todo not found" }, 404);
        }

        const deletedTodo = await db.delete(todoTable).where(eq(todoTable.id, todoId));

        if (!deletedTodo) {
            return c.json({ error: "Failed to delete todo" }, 500);
        }

        return c.json({
            message: "Todo deleted successfully",
            data: {
                deletedTodo
            }
        }, 200);
    } catch (error) {
        console.log(error);
        return c.json({ error: "Error deleting todo" }, 500);

    }
}
