import Router from 'express';
import taskRouter from './taskRouter';

const router = Router();

router.use("/task", taskRouter)

export default router;