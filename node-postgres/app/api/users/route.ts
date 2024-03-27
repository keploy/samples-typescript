import { NextResponse,NextRequest } from "next/server";
import db from "@/db";
import { User, NewUser, users } from "@/schemas/user";
import { eq } from "drizzle-orm";

export async function GET(request: NextRequest){
    const allUsers: User[] = await db.select().from(users)
    return NextResponse.json({users:allUsers})
}

export async function POST(request: NextRequest){
    const newUser: NewUser = await request.json()
    const createdUser = await db.insert(users).values(newUser).returning({
        id: users.id,
        name: users.name,
        email: users.email,
        createdAt: users.createdAt
    })
    return NextResponse.json({users:createdUser})
}

export async function PUT(request: NextRequest){
    const userToUpdate: User = await request.json()
    const user = await db.select().from(users).where(eq(users.id, userToUpdate.id))
    const updatedUser = await db.update(users).set({
        ...user[0],
        ...userToUpdate
    }).where(eq(users.id,userToUpdate.id)).returning({
        id: users.id,
        name: users.name,
        email: users.email,
        createdAt: users.createdAt
    })
    return NextResponse.json({users: updatedUser})
}

export async function DELETE(request: NextRequest){
    const userToDelete = await request.json()
    const deletedUser = await db.delete(users).where(eq(users.id, userToDelete.id)).returning({
        id: users.id,
        name: users.name,
        email: users.email,
        createdAt: users.createdAt
    })
    return NextResponse.json({users: deletedUser})
}