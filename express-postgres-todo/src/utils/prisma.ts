import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    // Set timeout for database operations (in milliseconds)
    transactionOptions: {
        timeout: 5000, // 5 seconds timeout for transactions
    },
});

export default prisma;

