import { Request, Response } from 'express';
import prisma from '../utils/prisma.js';
import { generateJsonPayload, generateRandomString } from '../utils/payload-generator.js';

// Bulk create todos
export const bulkCreateTodos = async (req: Request, res: Response) => {
    try {
        const { todos } = req.body;

        const created = await prisma.todo.createMany({
            data: todos.map((todo: {
                title: string;
                description?: string;
                completed?: boolean;
                priority?: number;
                categoryId?: number | null;
            }) => ({
                title: todo.title,
                description: todo.description,
                completed: todo.completed ?? false,
                priority: todo.priority ?? 1,
                categoryId: todo.categoryId
            }))
        });

        res.status(201).json({
            success: true,
            data: { count: created.count },
            message: `Successfully created ${created.count} todos`
        });
    } catch (error) {
        console.error('Error bulk creating todos:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to bulk create todos'
        });
    }
};

// Bulk get todos (for large response testing)
export const bulkGetTodos = async (req: Request, res: Response) => {
    try {
        const { limit = '100' } = req.query;
        const limitNum = Math.min(parseInt(limit as string), 10000);

        const todos = await prisma.todo.findMany({
            take: limitNum,
            include: {
                category: true,
                tags: {
                    include: { tag: true }
                },
                subtasks: true
            },
            orderBy: { createdAt: 'desc' }
        });

        res.json({
            success: true,
            data: todos,
            count: todos.length,
            responseSize: `~${Math.round(JSON.stringify(todos).length / 1024)}KB`
        });
    } catch (error) {
        console.error('Error bulk fetching todos:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to bulk fetch todos'
        });
    }
};

// Bulk delete todos
export const bulkDeleteTodos = async (req: Request, res: Response) => {
    try {
        const { ids } = req.body;

        const deleted = await prisma.todo.deleteMany({
            where: {
                id: { in: ids }
            }
        });

        res.json({
            success: true,
            data: { count: deleted.count },
            message: `Successfully deleted ${deleted.count} todos`
        });
    } catch (error) {
        console.error('Error bulk deleting todos:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to bulk delete todos'
        });
    }
};

// Seed database with random todos
export const seedDatabase = async (req: Request, res: Response) => {
    try {
        const { count = 100 } = req.body;

        // Create some categories first
        const categories = await prisma.category.createMany({
            data: [
                { name: `Work-${Date.now()}`, color: '#3B82F6', description: 'Work related tasks' },
                { name: `Personal-${Date.now()}`, color: '#10B981', description: 'Personal tasks' },
                { name: `Shopping-${Date.now()}`, color: '#F59E0B', description: 'Shopping list items' },
                { name: `Health-${Date.now()}`, color: '#EF4444', description: 'Health and fitness' },
            ],
            skipDuplicates: true
        });

        // Get all categories
        const allCategories = await prisma.category.findMany();
        const categoryIds = allCategories.map(c => c.id);

        // Create some tags
        await prisma.tag.createMany({
            data: [
                { name: `urgent-${Date.now()}`, color: '#EF4444' },
                { name: `important-${Date.now()}`, color: '#F59E0B' },
                { name: `quick-${Date.now()}`, color: '#10B981' },
                { name: `review-${Date.now()}`, color: '#6366F1' },
            ],
            skipDuplicates: true
        });

        // Generate todos
        const todos = [];
        const priorities = [1, 2, 3, 4];
        const statuses = [true, false, false, false, false]; // 20% completed

        for (let i = 0; i < count; i++) {
            const categoryId = categoryIds.length > 0
                ? categoryIds[Math.floor(Math.random() * categoryIds.length)]
                : null;

            todos.push({
                title: `Task ${i + 1}: ${generateRandomString(20)}`,
                description: `This is a detailed description for task ${i + 1}. ${generateRandomString(100)}`,
                completed: statuses[Math.floor(Math.random() * statuses.length)],
                priority: priorities[Math.floor(Math.random() * priorities.length)],
                categoryId,
                dueDate: Math.random() > 0.5
                    ? new Date(Date.now() + Math.random() * 30 * 24 * 60 * 60 * 1000)
                    : null
            });
        }

        const created = await prisma.todo.createMany({
            data: todos
        });

        res.status(201).json({
            success: true,
            data: {
                todosCreated: created.count,
                categoriesCreated: categories.count
            },
            message: `Database seeded with ${created.count} todos`
        });
    } catch (error) {
        console.error('Error seeding database:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to seed database'
        });
    }
};

// Get payload of specific size (for testing)
export const getPayload = async (req: Request, res: Response) => {
    try {
        const { sizeKb } = req.params;
        const size = parseInt(sizeKb);

        if (size > 10000) {
            res.status(400).json({
                success: false,
                message: 'Maximum payload size is 10MB (10000KB)'
            });
            return;
        }

        const payload = generateJsonPayload(size);

        res.json({
            success: true,
            requestedSizeKb: size,
            actualSizeBytes: JSON.stringify(payload).length,
            itemCount: payload.length,
            data: payload
        });
    } catch (error) {
        console.error('Error generating payload:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to generate payload'
        });
    }
};

// Clear all data (for testing)
export const clearDatabase = async (_req: Request, res: Response) => {
    try {
        // Delete in order to respect foreign key constraints
        await prisma.attachment.deleteMany();
        await prisma.subtask.deleteMany();
        await prisma.todoTag.deleteMany();
        await prisma.todo.deleteMany();
        await prisma.tag.deleteMany();
        await prisma.category.deleteMany();

        res.json({
            success: true,
            message: 'Database cleared successfully'
        });
    } catch (error) {
        console.error('Error clearing database:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to clear database'
        });
    }
};

// Get statistics
export const getStats = async (_req: Request, res: Response) => {
    try {
        const [todos, categories, tags, subtasks, attachments] = await Promise.all([
            prisma.todo.count(),
            prisma.category.count(),
            prisma.tag.count(),
            prisma.subtask.count(),
            prisma.attachment.count()
        ]);

        const completedTodos = await prisma.todo.count({ where: { completed: true } });
        const todosByPriority = await prisma.todo.groupBy({
            by: ['priority'],
            _count: { priority: true }
        });

        res.json({
            success: true,
            data: {
                todos: {
                    total: todos,
                    completed: completedTodos,
                    pending: todos - completedTodos,
                    byPriority: todosByPriority.reduce((acc, item) => {
                        acc[`priority_${item.priority}`] = item._count.priority;
                        return acc;
                    }, {} as Record<string, number>)
                },
                categories,
                tags,
                subtasks,
                attachments
            }
        });
    } catch (error) {
        console.error('Error fetching stats:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch statistics'
        });
    }
};
