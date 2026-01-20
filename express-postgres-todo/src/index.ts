import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import routes from './routes/index.js';
import prisma from './utils/prisma.js';

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan('combined'));
app.use(express.json({ limit: '50mb' })); // Large payload support
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Health check
app.get('/api/v1/health', (_req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});

// API routes
app.use('/api/v1', routes);

// 404 handler
app.use((_req, res) => {
    res.status(404).json({
        success: false,
        message: 'Endpoint not found'
    });
});

// Error handler
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    console.error('Unhandled error:', err);
    res.status(500).json({
        success: false,
        message: 'Internal server error'
    });
});

// Graceful shutdown
const shutdown = async () => {
    console.log('Shutting down gracefully...');
    await prisma.$disconnect();
    process.exit(0);
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Server is running on http://localhost:${PORT}`);
    console.log(`📋 API Documentation: http://localhost:${PORT}/api/v1/health`);
    console.log(`\nAvailable endpoints:`);
    console.log(`  GET    /api/v1/health          - Health check`);
    console.log(`  GET    /api/v1/todos           - List todos`);
    console.log(`  POST   /api/v1/todos           - Create todo`);
    console.log(`  GET    /api/v1/categories      - List categories`);
    console.log(`  GET    /api/v1/tags            - List tags`);
    console.log(`  GET    /api/v1/bulk/stats      - Database statistics`);
    console.log(`  POST   /api/v1/bulk/seed       - Seed database`);
    console.log(`  GET    /api/v1/bulk/payload/:kb - Get test payload`);
});

export default app;
