import { Router } from 'express';
import todoRoutes from './todo.routes.js';
import categoryRoutes from './category.routes.js';
import tagRoutes from './tag.routes.js';
import bulkRoutes from './bulk.routes.js';

const router = Router();

// Mount routes
router.use('/todos', todoRoutes);
router.use('/categories', categoryRoutes);
router.use('/tags', tagRoutes);
router.use('/bulk', bulkRoutes);

export default router;
