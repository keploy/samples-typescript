import { NextFunction, Request, Response } from 'express';
import zod from 'zod';
import { StatusCodes } from '../../config';
import { Task } from '../../types';

const validateParamSchema = zod.number();

const validateInputSchema = zod.object({
    author: zod.string().max(50, { message: "Author should not be more than 50 characters" }).optional(),
    title: zod.string().max(100, { message: "Title should not be more than 100 characters" }).optional(),
    description: zod.string().max(250, { message: "Description should not be more than 250 characters" }).optional(),
    dueDate: zod.string().regex(/^\d{4}-\d{2}-\d{2}$/, {message: "Date should be in this format 'YYYY-MM-DD'"}).optional(),
    status: zod.enum(['Pending', 'In-Progress', 'Completed'], {
        errorMap: () => ({
            message: "Status should be one of 'Pending', 'In-Progress', 'Completed'"
        })
    }).optional(),
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
    }).optional(),
}).strict();

const validateInputUpdate = (req: Request, res: Response, next: NextFunction) => {
    const body: Task = req.body;
    const id = parseInt(req.params.id);

    const zodResponseParam = validateParamSchema.safeParse(id);

    if(!zodResponseParam.success){
        return res.status(StatusCodes.BAD_REQUEST).json({
            message: zodResponseParam.error.issues[0].message
        })
    }

    const zodResponseBody = validateInputSchema.safeParse(body);

    if(!zodResponseBody.success){
        return res.status(StatusCodes.BAD_REQUEST).json({
            message: zodResponseBody.error.issues[0].message
        })
    }

    return next();
};

export default validateInputUpdate
