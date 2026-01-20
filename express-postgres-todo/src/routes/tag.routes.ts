import { Router } from 'express';
import {
    getTags,
    getTagById,
    createTag,
    updateTag,
    deleteTag
} from '../controllers/tag.controller.js';
import {
    validate,
    createTagSchema,
    idParamSchema
} from '../middlewares/validation.js';

const router = Router();

// GET /api/v1/tags - List all tags
router.get('/', getTags);

// GET /api/v1/tags/:id - Get tag by ID
router.get('/:id', validate(idParamSchema), getTagById);

// POST /api/v1/tags - Create tag
router.post('/', validate(createTagSchema), createTag);

// PUT /api/v1/tags/:id - Update tag (using same schema as create for now)
router.put('/:id', validate(idParamSchema), updateTag);

// DELETE /api/v1/tags/:id - Delete tag
router.delete('/:id', validate(idParamSchema), deleteTag);

export default router;
