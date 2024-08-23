import { PrismaClient } from "@prisma/client";
import checkDatabaseUrlExist from "./checkDatabaseUrlExist";

const prisma = new PrismaClient();

const viewTaskById = async (id: number)=>{
    checkDatabaseUrlExist();
    try{
        const task = await prisma.task.findUnique({
            where: {
                id: id
            }
        });

        if(!task){
            return {
                success: false,
                task: "Task does not exist"
            }
        }

        return {
            success: true,
            task
        }
    }catch(err: any){
        console.log(err);
        return {
            success: false,
            task: "Failed to Fetch Task"
        }
    }
}

export default viewTaskById;