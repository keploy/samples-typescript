import { PrismaClient } from "@prisma/client"
import checkDatabaseUrlExist from "./checkDatabaseUrlExist";

const prisma = new PrismaClient();

const deleteTask = async (id: number) => {
    checkDatabaseUrlExist();
    
    try{
        await prisma.task.delete({
            where: {
                id: id
            }
        });

        return {
            success: true,
            message: "Task Deleted Successfully"
        };
    }catch(err: any){
        console.log(err);
        return {
            success: false,
            message: "Failed To Delete Task"
        };
    }
}

export default deleteTask;