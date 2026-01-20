import { Router } from 'express';
import {
    bulkCreateTodos,
    bulkGetTodos,
    bulkDeleteTodos,
    seedDatabase,
    getPayload,
    clearDatabase,
    getStats
} from '../controllers/bulk.controller.js';
import {
    validate,
    bulkCreateTodosSchema,
    bulkDeleteTodosSchema,
    seedSchema,
    payloadSizeSchema
} from '../middlewares/validation.js';

const router = Router();

// POST /api/v1/bulk/todos - Bulk create todos
router.post('/todos', validate(bulkCreateTodosSchema), bulkCreateTodos);

// GET /api/v1/bulk/todos - Bulk get todos (large response)
router.get('/todos', bulkGetTodos);

// DELETE /api/v1/bulk/todos - Bulk delete todos
router.delete('/todos', validate(bulkDeleteTodosSchema), bulkDeleteTodos);

// POST /api/v1/bulk/seed - Seed database with random todos
router.post('/seed', validate(seedSchema), seedDatabase);

// GET /api/v1/bulk/payload/:sizeKb - Get payload of specific size
router.get('/payload/:sizeKb', validate(payloadSizeSchema), getPayload);

// DELETE /api/v1/bulk/clear - Clear all data
router.delete('/clear', clearDatabase);

// GET /api/v1/bulk/stats - Get database statistics
router.get('/stats', getStats);

export default router;
