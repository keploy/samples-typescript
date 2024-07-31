import Router, { Request, Response } from 'express';
import validateInputAdd from '../middlewares/add/validateInputAdd';
import validateInputUpdate from '../middlewares/update/validateInputUpdate';
import { createTask, updateTask, deleteTask } from '../utils';
import { Task, UpdateTask } from '../types';
import { StatusCodes } from '../config';
import validateInputDelete from '../middlewares/delete/validInputDelete';

const router = Router();

router.post("/add", validateInputAdd, async (req: Request, res: Response)=>{
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

router.put("/update/:id", validateInputUpdate, async (req: Request, res: Response)=>{
    const id = parseInt(req.params.id);
    const body: UpdateTask = req.body;

    const response = await updateTask(id, body);

    if(!response.success){
        return res.status(StatusCodes.FORBIDDEN).json({
            msg: response.message
        })
    }

    return res.status(StatusCodes.CREATED).json({
        msg: response.message
    })
})

router.delete("/delete/:id", validateInputDelete, async(req: Request, res: Response)=>{
    const id = parseInt(req.params.id);

    const response = await deleteTask(id);

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