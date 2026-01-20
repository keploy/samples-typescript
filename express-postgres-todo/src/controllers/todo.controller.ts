import { Request, Response } from 'express';
import prisma from '../utils/prisma.js';
import { Prisma } from '@prisma/client';

// Get all todos with pagination and filtering
export const getTodos = async (req: Request, res: Response) => {
    try {
        const {
            page = '1',
            limit = '20',
            completed,
            priority,
            categoryId,
            search,
            sortBy = 'createdAt',
            sortOrder = 'desc'
        } = req.query;

        const pageNum = parseInt(page as string);
        const limitNum = Math.min(parseInt(limit as string), 100); // Max 100 per page
        const skip = (pageNum - 1) * limitNum;

        // Build where clause
        const where: Prisma.TodoWhereInput = {};

        if (completed !== undefined) {
            where.completed = completed === 'true';
        }

        if (priority) {
            where.priority = parseInt(priority as string);
        }

        if (categoryId) {
            where.categoryId = parseInt(categoryId as string);
        }

        if (search) {
            where.OR = [
                { title: { contains: search as string, mode: 'insensitive' } },
                { description: { contains: search as string, mode: 'insensitive' } }
            ];
        }

        // Execute query with count
        const [todos, total] = await Promise.all([
            prisma.todo.findMany({
                where,
                include: {
                    category: true,
                    tags: {
                        include: { tag: true }
                    },
                    subtasks: true,
                    _count: {
                        select: { attachments: true, subtasks: true }
                    }
                },
                orderBy: { [sortBy as string]: sortOrder },
                skip,
                take: limitNum
            }),
            prisma.todo.count({ where })
        ]);

        res.json({
            success: true,
            data: todos,
            pagination: {
                page: pageNum,
                limit: limitNum,
                total,
                totalPages: Math.ceil(total / limitNum)
            }
        });
    } catch (error) {
        console.error('Error fetching todos:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch todos'
        });
    }
};

// Get todo by ID with all relations
export const getTodoById = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        const todo = await prisma.todo.findUnique({
            where: { id: parseInt(id) },
            include: {
                category: true,
                tags: {
                    include: { tag: true }
                },
                subtasks: {
                    orderBy: { order: 'asc' }
                },
                attachments: {
                    select: {
                        id: true,
                        filename: true,
                        mimeType: true,
                        size: true,
                        createdAt: true
                        // Exclude data field to reduce response size
                    }
                }
            }
        });

        if (!todo) {
            res.status(404).json({
                success: false,
                message: 'Todo not found'
            });
            return;
        }

        res.json({
            success: true,
            data: todo
        });
    } catch (error) {
        console.error('Error fetching todo:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch todo'
        });
    }
};

// Create todo
export const createTodo = async (req: Request, res: Response) => {
    try {
        const { title, description, completed, priority, dueDate, categoryId, tagIds } = req.body;

        const todo = await prisma.todo.create({
            data: {
                title,
                description,
                completed: completed ?? false,
                priority: priority ?? 1,
                dueDate: dueDate ? new Date(dueDate) : null,
                categoryId,
                ...(tagIds && tagIds.length > 0 && {
                    tags: {
                        create: tagIds.map((tagId: number) => ({
                            tag: { connect: { id: tagId } }
                        }))
                    }
                })
            },
            include: {
                category: true,
                tags: {
                    include: { tag: true }
                }
            }
        });

        res.status(201).json({
            success: true,
            data: todo,
            message: 'Todo created successfully'
        });
    } catch (error) {
        console.error('Error creating todo:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create todo'
        });
    }
};

// Update todo
export const updateTodo = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { title, description, completed, priority, dueDate, categoryId } = req.body;

        const todo = await prisma.todo.update({
            where: { id: parseInt(id) },
            data: {
                ...(title !== undefined && { title }),
                ...(description !== undefined && { description }),
                ...(completed !== undefined && { completed }),
                ...(priority !== undefined && { priority }),
                ...(dueDate !== undefined && { dueDate: dueDate ? new Date(dueDate) : null }),
                ...(categoryId !== undefined && { categoryId })
            },
            include: {
                category: true,
                tags: {
                    include: { tag: true }
                },
                subtasks: true
            }
        });

        res.json({
            success: true,
            data: todo,
            message: 'Todo updated successfully'
        });
    } catch (error: unknown) {
        console.error('Error updating todo:', error);
        if (error && typeof error === 'object' && 'code' in error && error.code === 'P2025') {
            res.status(404).json({
                success: false,
                message: 'Todo not found'
            });
            return;
        }
        res.status(500).json({
            success: false,
            message: 'Failed to update todo'
        });
    }
};

// Toggle todo completion
export const toggleTodo = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        const existingTodo = await prisma.todo.findUnique({
            where: { id: parseInt(id) }
        });

        if (!existingTodo) {
            res.status(404).json({
                success: false,
                message: 'Todo not found'
            });
            return;
        }

        const todo = await prisma.todo.update({
            where: { id: parseInt(id) },
            data: { completed: !existingTodo.completed }
        });

        res.json({
            success: true,
            data: todo,
            message: `Todo marked as ${todo.completed ? 'completed' : 'incomplete'}`
        });
    } catch (error) {
        console.error('Error toggling todo:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to toggle todo'
        });
    }
};

// Delete todo
export const deleteTodo = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        await prisma.todo.delete({
            where: { id: parseInt(id) }
        });

        res.json({
            success: true,
            message: 'Todo deleted successfully'
        });
    } catch (error: unknown) {
        console.error('Error deleting todo:', error);
        if (error && typeof error === 'object' && 'code' in error && error.code === 'P2025') {
            res.status(404).json({
                success: false,
                message: 'Todo not found'
            });
            return;
        }
        res.status(500).json({
            success: false,
            message: 'Failed to delete todo'
        });
    }
};

// Add subtask to todo
export const addSubtask = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { title } = req.body;

        // Get the current max order for subtasks
        const maxOrder = await prisma.subtask.aggregate({
            where: { todoId: parseInt(id) },
            _max: { order: true }
        });

        const subtask = await prisma.subtask.create({
            data: {
                title,
                todoId: parseInt(id),
                order: (maxOrder._max.order ?? -1) + 1
            }
        });

        res.status(201).json({
            success: true,
            data: subtask,
            message: 'Subtask added successfully'
        });
    } catch (error: unknown) {
        console.error('Error adding subtask:', error);
        if (error && typeof error === 'object' && 'code' in error && error.code === 'P2003') {
            res.status(404).json({
                success: false,
                message: 'Todo not found'
            });
            return;
        }
        res.status(500).json({
            success: false,
            message: 'Failed to add subtask'
        });
    }
};

// Toggle subtask completion
export const toggleSubtask = async (req: Request, res: Response) => {
    try {
        const { id, subtaskId } = req.params;

        const subtask = await prisma.subtask.findFirst({
            where: {
                id: parseInt(subtaskId),
                todoId: parseInt(id)
            }
        });

        if (!subtask) {
            res.status(404).json({
                success: false,
                message: 'Subtask not found'
            });
            return;
        }

        const updated = await prisma.subtask.update({
            where: { id: parseInt(subtaskId) },
            data: { completed: !subtask.completed }
        });

        res.json({
            success: true,
            data: updated,
            message: `Subtask marked as ${updated.completed ? 'completed' : 'incomplete'}`
        });
    } catch (error) {
        console.error('Error toggling subtask:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to toggle subtask'
        });
    }
};

// Delete subtask
export const deleteSubtask = async (req: Request, res: Response) => {
    try {
        const { id, subtaskId } = req.params;

        const subtask = await prisma.subtask.findFirst({
            where: {
                id: parseInt(subtaskId),
                todoId: parseInt(id)
            }
        });

        if (!subtask) {
            res.status(404).json({
                success: false,
                message: 'Subtask not found'
            });
            return;
        }

        await prisma.subtask.delete({
            where: { id: parseInt(subtaskId) }
        });

        res.json({
            success: true,
            message: 'Subtask deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting subtask:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete subtask'
        });
    }
};

// Add tag to todo
export const addTagToTodo = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { tagId } = req.body;

        const todoTag = await prisma.todoTag.create({
            data: {
                todoId: parseInt(id),
                tagId: parseInt(tagId)
            },
            include: {
                tag: true
            }
        });

        res.status(201).json({
            success: true,
            data: todoTag,
            message: 'Tag added to todo successfully'
        });
    } catch (error: unknown) {
        console.error('Error adding tag to todo:', error);
        if (error && typeof error === 'object' && 'code' in error) {
            if (error.code === 'P2002') {
                res.status(409).json({
                    success: false,
                    message: 'Tag already added to this todo'
                });
                return;
            }
            if (error.code === 'P2003') {
                res.status(404).json({
                    success: false,
                    message: 'Todo or tag not found'
                });
                return;
            }
        }
        res.status(500).json({
            success: false,
            message: 'Failed to add tag to todo'
        });
    }
};

// Remove tag from todo
export const removeTagFromTodo = async (req: Request, res: Response) => {
    try {
        const { id, tagId } = req.params;

        await prisma.todoTag.delete({
            where: {
                todoId_tagId: {
                    todoId: parseInt(id),
                    tagId: parseInt(tagId)
                }
            }
        });

        res.json({
            success: true,
            message: 'Tag removed from todo successfully'
        });
    } catch (error: unknown) {
        console.error('Error removing tag from todo:', error);
        if (error && typeof error === 'object' && 'code' in error && error.code === 'P2025') {
            res.status(404).json({
                success: false,
                message: 'Tag not found on this todo'
            });
            return;
        }
        res.status(500).json({
            success: false,
            message: 'Failed to remove tag from todo'
        });
    }
};

// Add attachment to todo
export const addAttachment = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { filename, data, mimeType } = req.body;

        const size = Buffer.byteLength(data, 'base64');

        const attachment = await prisma.attachment.create({
            data: {
                filename,
                data,
                mimeType: mimeType ?? 'application/octet-stream',
                size,
                todoId: parseInt(id)
            },
            select: {
                id: true,
                filename: true,
                mimeType: true,
                size: true,
                createdAt: true
            }
        });

        res.status(201).json({
            success: true,
            data: attachment,
            message: 'Attachment added successfully'
        });
    } catch (error: unknown) {
        console.error('Error adding attachment:', error);
        if (error && typeof error === 'object' && 'code' in error && error.code === 'P2003') {
            res.status(404).json({
                success: false,
                message: 'Todo not found'
            });
            return;
        }
        res.status(500).json({
            success: false,
            message: 'Failed to add attachment'
        });
    }
};

// Get attachment with data
export const getAttachment = async (req: Request, res: Response) => {
    try {
        const { id, attachmentId } = req.params;

        const attachment = await prisma.attachment.findFirst({
            where: {
                id: parseInt(attachmentId),
                todoId: parseInt(id)
            }
        });

        if (!attachment) {
            res.status(404).json({
                success: false,
                message: 'Attachment not found'
            });
            return;
        }

        res.json({
            success: true,
            data: attachment
        });
    } catch (error) {
        console.error('Error fetching attachment:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch attachment'
        });
    }
};

// Delete attachment
export const deleteAttachment = async (req: Request, res: Response) => {
    try {
        const { id, attachmentId } = req.params;

        const attachment = await prisma.attachment.findFirst({
            where: {
                id: parseInt(attachmentId),
                todoId: parseInt(id)
            }
        });

        if (!attachment) {
            res.status(404).json({
                success: false,
                message: 'Attachment not found'
            });
            return;
        }

        await prisma.attachment.delete({
            where: { id: parseInt(attachmentId) }
        });

        res.json({
            success: true,
            message: 'Attachment deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting attachment:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete attachment'
        });
    }
};
