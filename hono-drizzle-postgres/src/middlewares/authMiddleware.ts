import jwt, { type JwtPayload } from "jsonwebtoken";
import type  { Context, Next } from "hono";
import { getCookie } from "hono/cookie";

const JWT_SECRET = "your_secret_key"; // Replace with env variable

export const authMiddleware = async (c: Context, next: Next) => {
    const authHeader = c.req.header("Authorization");
    
    const tokenFromHeader = authHeader?.startsWith("Bearer ") ? authHeader.split(" ")[1] : null;

    const token = tokenFromHeader;
    

    if (!token) {
        return c.json({ error: "Unauthorized" }, 401);
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload & { userId: string };
        c.set("userId", decoded.userId);
        await next();
    } catch (error) {
        return c.json({ error: "Invalid or expired token" }, 401);
    }
};
