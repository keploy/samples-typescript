import Router, { Request, Response } from 'express';
import validateInputAdd from '../middlewares/add/validateInputAdd';
import validateInputUpdate from '../middlewares/update/validateInputUpdate';
import { createTask, updateTask, deleteTask, viewTask, viewTaskById, changeTaskPriority } from '../utils';
import { Task, UpdateTask } from '../types';
import { StatusCodes } from '../config';
import validateInputParam from '../middlewares/validateInputParam';
import validateInputChangePriority from '../middlewares/change-priority/validateInputChangePriority';

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

router.put("/update/:id", validateInputParam, validateInputUpdate, async (req: Request, res: Response)=>{
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

router.delete("/delete/:id", validateInputParam, async(req: Request, res: Response)=>{
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

router.get("/view", async(req: Request, res: Response)=>{
    const response = await viewTask();

    if(!response.success){
        return res.status(StatusCodes.FORBIDDEN).json({
            tasks: response.tasks
        })
    }

    return res.status(StatusCodes.CREATED).json({
        tasks: response.tasks
    })
})

router.get("/view/:id", validateInputParam, async(req: Request, res: Response)=>{
    const id = parseInt(req.params.id);

    const response = await viewTaskById(id);

    if(!response.success){
        return res.status(StatusCodes.FORBIDDEN).json({
            tasks: response.task
        })
    }

    return res.status(StatusCodes.CREATED).json({
        tasks: response.task
    })
})

router.put("/change-priority/:id", validateInputParam, validateInputChangePriority, async(req: Request, res: Response)=>{
    const id = parseInt(req.params.id);
    const priority = parseInt(req.body.priority);

    const response = await changeTaskPriority(id, priority);

    if(!response.success){
        return res.status(StatusCodes.FORBIDDEN).json({
            tasks: response.message
        })
    }

    return res.status(StatusCodes.CREATED).json({
        tasks: response.message
    })
})

export default router;