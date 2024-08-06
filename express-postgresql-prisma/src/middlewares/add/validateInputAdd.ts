import { NextFunction, Request, Response } from 'express';
import zod from 'zod';
import { StatusCodes } from '../../config';
import { Task } from '../../types';

const validateInputSchema = zod.object({
    author: zod.string().max(50, { message: "Author should not be more than 50 characters" }),
    title: zod.string().max(100, { message: "Title should not be more than 100 characters" }),
    description: zod.string().max(250, { message: "Description should not be more than 250 characters" }),
    dueDate: zod.string().regex(/^\d{4}-\d{2}-\d{2}$/, {message: "Date should be in this format 'YYYY-MM-DD'"}),
    status: zod.enum(['Pending', 'In-Progress', 'Completed'], {
        errorMap: () => ({
            message: "Status should be one of 'Pending', 'In-Progress', 'Completed'"
        })
    }),
    priority: zod.union([
        zod.literal(1),
        zod.literal(2),
        zod.literal(3),
        zod.literal(4),
        zod.literal(5),
    ], {
        errorMap: () => ({
            message: "Priority should be one of the following: 1, 2, 3, 4, or 5"
        })
    }),
}).strict();

const validateInputAdd = (req: Request, res: Response, next: NextFunction) => {
    const body: Task = req.body;
    const zodResponse = validateInputSchema.safeParse(body);

    if(!zodResponse.success){
        return res.status(StatusCodes.BAD_REQUEST).json({
            message: zodResponse.error.issues[0].message
        })
    }

    return next();
};

export default validateInputAdd;
