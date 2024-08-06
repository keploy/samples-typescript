import { PrismaClient } from "@prisma/client";
import checkDatabaseUrlExist from "./checkDatabaseUrlExist";

const prisma = new PrismaClient();

const changeTaskPriority = async (id: number, priority: number) => {
    checkDatabaseUrlExist();
    try{
        await prisma.task.update({
            where: {
                id: id
            }, 
            data: {
                priority: priority
            }
        })

        return {
            success: true,
            message: "Priority Changed Successfully"
        };
    }catch(err: any){
        return {
            success: true,
            message: "Failed to Change Priority"
        };
    }
}

export default changeTaskPriority;