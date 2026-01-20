import { Router } from 'express';
import {
    getCategories,
    getCategoryById,
    createCategory,
    updateCategory,
    deleteCategory
} from '../controllers/category.controller.js';
import {
    validate,
    createCategorySchema,
    updateCategorySchema,
    idParamSchema
} from '../middlewares/validation.js';

const router = Router();

// GET /api/v1/categories - List all categories
router.get('/', getCategories);

// GET /api/v1/categories/:id - Get category by ID
router.get('/:id', validate(idParamSchema), getCategoryById);

// POST /api/v1/categories - Create category
router.post('/', validate(createCategorySchema), createCategory);

// PUT /api/v1/categories/:id - Update category
router.put('/:id', validate(updateCategorySchema), updateCategory);

// DELETE /api/v1/categories/:id - Delete category
router.delete('/:id', validate(idParamSchema), deleteCategory);

export default router;
