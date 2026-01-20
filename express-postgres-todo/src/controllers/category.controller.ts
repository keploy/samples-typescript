import { Request, Response } from 'express';
import prisma from '../utils/prisma.js';

// Get all categories
export const getCategories = async (_req: Request, res: Response) => {
    try {
        const categories = await prisma.category.findMany({
            include: {
                _count: {
                    select: { todos: true }
                }
            },
            orderBy: { name: 'asc' }
        });

        res.json({
            success: true,
            data: categories,
            count: categories.length
        });
    } catch (error) {
        console.error('Error fetching categories:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch categories'
        });
    }
};

// Get category by ID
export const getCategoryById = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const category = await prisma.category.findUnique({
            where: { id: parseInt(id) },
            include: {
                todos: {
                    take: 10,
                    orderBy: { createdAt: 'desc' }
                },
                _count: {
                    select: { todos: true }
                }
            }
        });

        if (!category) {
            res.status(404).json({
                success: false,
                message: 'Category not found'
            });
            return;
        }

        res.json({
            success: true,
            data: category
        });
    } catch (error) {
        console.error('Error fetching category:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch category'
        });
    }
};

// Create category
export const createCategory = async (req: Request, res: Response) => {
    try {
        const { name, color, description } = req.body;

        const category = await prisma.category.create({
            data: { name, color, description }
        });

        res.status(201).json({
            success: true,
            data: category,
            message: 'Category created successfully'
        });
    } catch (error: unknown) {
        console.error('Error creating category:', error);
        if (error && typeof error === 'object' && 'code' in error && error.code === 'P2002') {
            res.status(409).json({
                success: false,
                message: 'Category with this name already exists'
            });
            return;
        }
        res.status(500).json({
            success: false,
            message: 'Failed to create category'
        });
    }
};

// Update category
export const updateCategory = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { name, color, description } = req.body;

        const category = await prisma.category.update({
            where: { id: parseInt(id) },
            data: {
                ...(name && { name }),
                ...(color && { color }),
                ...(description !== undefined && { description })
            }
        });

        res.json({
            success: true,
            data: category,
            message: 'Category updated successfully'
        });
    } catch (error: unknown) {
        console.error('Error updating category:', error);
        if (error && typeof error === 'object' && 'code' in error && error.code === 'P2025') {
            res.status(404).json({
                success: false,
                message: 'Category not found'
            });
            return;
        }
        res.status(500).json({
            success: false,
            message: 'Failed to update category'
        });
    }
};

// Delete category
export const deleteCategory = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        await prisma.category.delete({
            where: { id: parseInt(id) }
        });

        res.json({
            success: true,
            message: 'Category deleted successfully'
        });
    } catch (error: unknown) {
        console.error('Error deleting category:', error);
        if (error && typeof error === 'object' && 'code' in error && error.code === 'P2025') {
            res.status(404).json({
                success: false,
                message: 'Category not found'
            });
            return;
        }
        res.status(500).json({
            success: false,
            message: 'Failed to delete category'
        });
    }
};
