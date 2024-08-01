import { NextFunction, Request, Response } from 'express';
import zod from 'zod';
import { StatusCodes } from '../../config';

const validateInputChangePrioritySchema = zod.union([
    zod.literal(1),
    zod.literal(2),
    zod.literal(3),
    zod.literal(4),
    zod.literal(5)
], {
    errorMap: ()=>({
        message: "Priority should be one of the following: 1, 2, 3, 4, or 5"
    })
})

const validateInputChangePriority = (req: Request, res: Response, next: NextFunction)=>{
    const priority = parseInt(req.body.priority);

    const zodResponse = validateInputChangePrioritySchema.safeParse(priority);

    if(!zodResponse.success){
        return res.status(StatusCodes.BAD_REQUEST).json({
            message: zodResponse.error.issues[0].message
        })
    }

    return next();
}

export default validateInputChangePriority;