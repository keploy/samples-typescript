import { Request, Response } from 'express';
import prisma from '../utils/prisma.js';

// Get all tags
export const getTags = async (_req: Request, res: Response) => {
    try {
        const tags = await prisma.tag.findMany({
            include: {
                _count: {
                    select: { todos: true }
                }
            },
            orderBy: { name: 'asc' }
        });

        res.json({
            success: true,
            data: tags,
            count: tags.length
        });
    } catch (error) {
        console.error('Error fetching tags:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch tags'
        });
    }
};

// Get tag by ID
export const getTagById = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const tag = await prisma.tag.findUnique({
            where: { id: parseInt(id) },
            include: {
                todos: {
                    include: {
                        todo: true
                    },
                    take: 10
                },
                _count: {
                    select: { todos: true }
                }
            }
        });

        if (!tag) {
            res.status(404).json({
                success: false,
                message: 'Tag not found'
            });
            return;
        }

        res.json({
            success: true,
            data: tag
        });
    } catch (error) {
        console.error('Error fetching tag:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch tag'
        });
    }
};

// Create tag
export const createTag = async (req: Request, res: Response) => {
    try {
        const { name, color } = req.body;

        const tag = await prisma.tag.create({
            data: { name, color }
        });

        res.status(201).json({
            success: true,
            data: tag,
            message: 'Tag created successfully'
        });
    } catch (error: unknown) {
        console.error('Error creating tag:', error);
        if (error && typeof error === 'object' && 'code' in error && error.code === 'P2002') {
            res.status(409).json({
                success: false,
                message: 'Tag with this name already exists'
            });
            return;
        }
        res.status(500).json({
            success: false,
            message: 'Failed to create tag'
        });
    }
};

// Update tag
export const updateTag = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { name, color } = req.body;

        const tag = await prisma.tag.update({
            where: { id: parseInt(id) },
            data: {
                ...(name && { name }),
                ...(color && { color })
            }
        });

        res.json({
            success: true,
            data: tag,
            message: 'Tag updated successfully'
        });
    } catch (error: unknown) {
        console.error('Error updating tag:', error);
        if (error && typeof error === 'object' && 'code' in error && error.code === 'P2025') {
            res.status(404).json({
                success: false,
                message: 'Tag not found'
            });
            return;
        }
        res.status(500).json({
            success: false,
            message: 'Failed to update tag'
        });
    }
};

// Delete tag
export const deleteTag = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        await prisma.tag.delete({
            where: { id: parseInt(id) }
        });

        res.json({
            success: true,
            message: 'Tag deleted successfully'
        });
    } catch (error: unknown) {
        console.error('Error deleting tag:', error);
        if (error && typeof error === 'object' && 'code' in error && error.code === 'P2025') {
            res.status(404).json({
                success: false,
                message: 'Tag not found'
            });
            return;
        }
        res.status(500).json({
            success: false,
            message: 'Failed to delete tag'
        });
    }
};
