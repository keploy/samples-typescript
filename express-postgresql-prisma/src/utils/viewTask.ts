import { PrismaClient } from "@prisma/client";
import checkDatabaseUrlExist from "./checkDatabaseUrlExist";

const prisma = new PrismaClient();

const viewTask = async ()=>{
    checkDatabaseUrlExist();
    try{
        const tasks = await prisma.task.findMany();
        
        if(tasks.length == 0){
            return {
                success: false,
                tasks: "Task does not exist"
            }
        }

        return {
            success: true,
            tasks
        }
    }catch(err: any){
        console.log(err);
        return {
            success: false,
            tasks: "Failed to Fetch Tasks"
        }
    }
}

export default viewTask;