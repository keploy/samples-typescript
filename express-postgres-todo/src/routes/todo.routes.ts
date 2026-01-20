import { Router } from 'express';
import {
    getTodos,
    getTodoById,
    createTodo,
    updateTodo,
    toggleTodo,
    deleteTodo,
    addSubtask,
    toggleSubtask,
    deleteSubtask,
    addTagToTodo,
    removeTagFromTodo,
    addAttachment,
    getAttachment,
    deleteAttachment
} from '../controllers/todo.controller.js';
import {
    validate,
    createTodoSchema,
    updateTodoSchema,
    idParamSchema,
    listTodosQuerySchema,
    createSubtaskSchema,
    createAttachmentSchema
} from '../middlewares/validation.js';

const router = Router();

// GET /api/v1/todos - List all todos with pagination and filtering
router.get('/', validate(listTodosQuerySchema), getTodos);

// GET /api/v1/todos/:id - Get todo by ID
router.get('/:id', validate(idParamSchema), getTodoById);

// POST /api/v1/todos - Create todo
router.post('/', validate(createTodoSchema), createTodo);

// PUT /api/v1/todos/:id - Update todo
router.put('/:id', validate(updateTodoSchema), updateTodo);

// PATCH /api/v1/todos/:id/toggle - Toggle todo completion
router.patch('/:id/toggle', validate(idParamSchema), toggleTodo);

// DELETE /api/v1/todos/:id - Delete todo
router.delete('/:id', validate(idParamSchema), deleteTodo);

// Subtask routes
// POST /api/v1/todos/:id/subtasks - Add subtask
router.post('/:id/subtasks', validate(createSubtaskSchema), addSubtask);

// PATCH /api/v1/todos/:id/subtasks/:subtaskId/toggle - Toggle subtask
router.patch('/:id/subtasks/:subtaskId/toggle', toggleSubtask);

// DELETE /api/v1/todos/:id/subtasks/:subtaskId - Delete subtask
router.delete('/:id/subtasks/:subtaskId', deleteSubtask);

// Tag routes
// POST /api/v1/todos/:id/tags - Add tag to todo
router.post('/:id/tags', addTagToTodo);

// DELETE /api/v1/todos/:id/tags/:tagId - Remove tag from todo
router.delete('/:id/tags/:tagId', removeTagFromTodo);

// Attachment routes
// POST /api/v1/todos/:id/attachments - Add attachment
router.post('/:id/attachments', validate(createAttachmentSchema), addAttachment);

// GET /api/v1/todos/:id/attachments/:attachmentId - Get attachment with data
router.get('/:id/attachments/:attachmentId', getAttachment);

// DELETE /api/v1/todos/:id/attachments/:attachmentId - Delete attachment
router.delete('/:id/attachments/:attachmentId', deleteAttachment);

export default router;
