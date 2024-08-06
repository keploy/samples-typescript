import { PrismaClient } from "@prisma/client"
import { UpdateTask } from "../types"
import checkDatabaseUrlExist from "./checkDatabaseUrlExist";

const prisma = new PrismaClient();

const updateTask = async (id: number, data: UpdateTask) => {
    checkDatabaseUrlExist();
    try{
        await prisma.task.update({
            where: {
                id: id
            },
            data
        });

        return {
            success: true,
            message: "Task Updated Successfully"
        };
    }catch(err: any){
        console.log(err);
        return {
            success: false,
            message: "Failed To Update Task"
        };
    }
}

export default updateTask;