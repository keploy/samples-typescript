import { NextFunction, Request, Response } from 'express';
import zod from 'zod';
import { StatusCodes } from '../../config';

const validateParamSchema = zod.number();

const validateInputDelete = (req: Request, res: Response, next: NextFunction) => {
    const id = parseInt(req.params.id);

    const zodResponseParam = validateParamSchema.safeParse(id);

    if(!zodResponseParam.success){
        return res.status(StatusCodes.BAD_REQUEST).json({
            message: zodResponseParam.error.issues[0].message
        })
    }

    return next();
};

export default validateInputDelete;
