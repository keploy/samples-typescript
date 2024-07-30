import Router, { Request, Response } from 'express';
import validateInput from '../middlewares/add/validateInput';
import { Prisma, PrismaClient } from '@prisma/client';

const router = Router();

router.post("/add", validateInput, (req: Request, res: Response)=>{
    
})

export default router