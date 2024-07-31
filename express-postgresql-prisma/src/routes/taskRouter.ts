import Router, { Request, Response } from 'express';
import validateInput from '../middlewares/add/validateInput';
import { createTask } from '../utils';
import { Task } from '../types';
import { StatusCodes } from '../config';

const router = Router();

router.post("/add", validateInput, async (req: Request, res: Response)=>{
    const body: Task = req.body;

    const response = await createTask(body);

    if(!response.success){
        return res.status(StatusCodes.FORBIDDEN).json({
            msg: response.message
        })
    }

    return res.status(StatusCodes.CREATED).json({
        msg: response.message
    })
})

export default router