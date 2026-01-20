import { Request, Response, NextFunction } from 'express';
import { z, ZodError, ZodSchema } from 'zod';

/**
 * Generic validation middleware factory
 */
export const validate = (schema: ZodSchema) => {
    return (req: Request, res: Response, next: NextFunction) => {
        try {
            schema.parse({
                body: req.body,
                query: req.query,
                params: req.params,
            });
            next();
        } catch (error) {
            if (error instanceof ZodError) {
                res.status(400).json({
                    success: false,
                    message: 'Validation error',
                    errors: error.errors.map(e => ({
                        field: e.path.join('.'),
                        message: e.message
                    }))
                });
                return;
            }
            next(error);
        }
    };
};

// Todo validation schemas
export const createTodoSchema = z.object({
    body: z.object({
        title: z.string().min(1, 'Title is required').max(255),
        description: z.string().max(5000).optional(),
        completed: z.boolean().optional().default(false),
        priority: z.number().int().min(1).max(4).optional().default(1),
        dueDate: z.string().datetime().optional().nullable(),
        categoryId: z.number().int().positive().optional().nullable(),
        tagIds: z.array(z.number().int().positive()).optional(),
    })
});

export const updateTodoSchema = z.object({
    params: z.object({
        id: z.string().regex(/^\d+$/, 'ID must be a number')
    }),
    body: z.object({
        title: z.string().min(1).max(255).optional(),
        description: z.string().max(5000).optional().nullable(),
        completed: z.boolean().optional(),
        priority: z.number().int().min(1).max(4).optional(),
        dueDate: z.string().datetime().optional().nullable(),
        categoryId: z.number().int().positive().optional().nullable(),
    })
});

export const idParamSchema = z.object({
    params: z.object({
        id: z.string().regex(/^\d+$/, 'ID must be a number')
    })
});

// Category validation schemas
export const createCategorySchema = z.object({
    body: z.object({
        name: z.string().min(1, 'Name is required').max(100),
        color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid color format').optional(),
        description: z.string().max(500).optional(),
    })
});

export const updateCategorySchema = z.object({
    params: z.object({
        id: z.string().regex(/^\d+$/, 'ID must be a number')
    }),
    body: z.object({
        name: z.string().min(1).max(100).optional(),
        color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid color format').optional(),
        description: z.string().max(500).optional().nullable(),
    })
});

// Tag validation schemas
export const createTagSchema = z.object({
    body: z.object({
        name: z.string().min(1, 'Name is required').max(50),
        color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid color format').optional(),
    })
});

// Subtask validation schemas
export const createSubtaskSchema = z.object({
    params: z.object({
        id: z.string().regex(/^\d+$/, 'Todo ID must be a number')
    }),
    body: z.object({
        title: z.string().min(1, 'Title is required').max(255),
    })
});

// Attachment validation schemas
export const createAttachmentSchema = z.object({
    params: z.object({
        id: z.string().regex(/^\d+$/, 'Todo ID must be a number')
    }),
    body: z.object({
        filename: z.string().min(1, 'Filename is required').max(255),
        data: z.string().min(1, 'Data is required'),
        mimeType: z.string().optional(),
    })
});

// Bulk operation schemas
export const bulkCreateTodosSchema = z.object({
    body: z.object({
        todos: z.array(z.object({
            title: z.string().min(1).max(255),
            description: z.string().max(5000).optional(),
            completed: z.boolean().optional(),
            priority: z.number().int().min(1).max(4).optional(),
            categoryId: z.number().int().positive().optional().nullable(),
        })).min(1).max(1000, 'Maximum 1000 todos per request')
    })
});

export const bulkDeleteTodosSchema = z.object({
    body: z.object({
        ids: z.array(z.number().int().positive()).min(1).max(1000, 'Maximum 1000 IDs per request')
    })
});

export const seedSchema = z.object({
    body: z.object({
        count: z.number().int().min(1).max(10000, 'Maximum 10000 todos').default(100)
    })
});

// Query validation for list endpoints
export const listTodosQuerySchema = z.object({
    query: z.object({
        page: z.string().regex(/^\d+$/).optional(),
        limit: z.string().regex(/^\d+$/).optional(),
        completed: z.enum(['true', 'false']).optional(),
        priority: z.string().regex(/^[1-4]$/).optional(),
        categoryId: z.string().regex(/^\d+$/).optional(),
        search: z.string().max(100).optional(),
        sortBy: z.enum(['createdAt', 'updatedAt', 'priority', 'dueDate', 'title']).optional(),
        sortOrder: z.enum(['asc', 'desc']).optional(),
    })
});

export const payloadSizeSchema = z.object({
    params: z.object({
        sizeKb: z.string().regex(/^\d+$/, 'Size must be a number')
    })
});
