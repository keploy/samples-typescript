import type { Context } from "hono";
import { getCookie, setCookie } from "hono/cookie";
import { usersTable } from "../drizzle/schema.js";
import { db } from "../drizzle/db.js";
import bcryptjs from 'bcryptjs';
import { eq } from "drizzle-orm";
import jwt from "jsonwebtoken";

interface registerType {
    name: string;
    email: string;
    password: string;
}

interface loginType {
    email: string;
    password: string;
}


const JWT_SECRET = "your_secret_key"; // Replace with env variable

export const register = async (c: Context) => {
    try {
        const { name, email, password }: registerType = await c.req.json();
        if (!name || !email || !password) {
            return c.json({ error: "All fields are required" }, 400);
        }

        const genSalt = await bcryptjs.genSalt(10)
        const hashedPassword = await bcryptjs.hash(password, genSalt);

        const user = await db.insert(usersTable).values({
            name,
            email,
            password: hashedPassword
        })

        if (!user) {
            return c.json({ error: "Failed to register" }, 500);
        }


        
        return c.json({
            message: "User registered successfully",
            data: {
                name,
                email
            }
        }, 201);
    } catch (error) {
        console.log(error);
        return c.json({ error: "Error registering user" }, 500);
    }
}


export const login = async (c: Context) => {
    try {
        const { email, password }: loginType = await c.req.json();
    
        if (!email || !password) {
            return c.json({ error: "All fields are required" }, 400);
        }
    
        const user = await db
            .select()
            .from(usersTable)
            .where(eq(usersTable.email, email));
    
        if(!user[0]){
            return c.json({error: "User not found"}, 404);
        }
    
        const isCorrectPassword = await bcryptjs.compare(password, user[0].password);
    
        if(!isCorrectPassword){
            return c.json({error: "Invalid password"}, 401);
        }
    
    
        const token = jwt.sign({ userId: user[0].id }, JWT_SECRET);
        console.log(token,"token");


        return c.json({
            message: "Login successful",
            data: {
                name: user[0].name,
                email: user[0].email
            },
            token: token
        }, 200);
    } catch (error) {
        console.log(error);
        return c.json({ error: "Error logging in" }, 500);
        
    }

}



export const logout = async (c: Context) => {
    try {

        c.res.headers.set("Authorization", "");

        return c.json({
            message: "Logged out successfully"
        }, 200);

    } catch (error) {
        console.log(error);
        return c.json({ error: "Error logging out" }, 500);
    }
}