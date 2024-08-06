import { PrismaClient } from "@prisma/client"
import { Task } from "../types";
import checkDatabaseUrlExist from "./checkDatabaseUrlExist";

const prisma = new PrismaClient();

interface CreateTaskResponse {
    success: boolean;
    message: string;
};

const createTask = async (data: Task): Promise<CreateTaskResponse> => {
    checkDatabaseUrlExist();
    try {
        await prisma.task.create({
            data: data
        });

        return {
            success: true,
            message: "Task Created Successfully"
        };
    }catch(err: any){
        console.log(err);
        return {
            success: false,
            message: "Failed To Create Task"
        };
    }
}

export default createTask;