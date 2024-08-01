import { Application } from 'express';
import swaggerJsDoc from 'swagger-jsdoc';
import swaggerUI from 'swagger-ui-express';

const options = {
    definition: {
        openapi: "3.0.0",
        info: {
            title: "Task Management API",
            version: "1.0.0",
            description: "An API to manage personal or team tasks, built with Express, PostgreSQL, and Prisma."
        },
    },
    apis: ["./src/routes/*.ts"]
};

const specs = swaggerJsDoc(options);

const setupSwagger = (app: Application) => {
    app.use("/api/docs", swaggerUI.serve, swaggerUI.setup(specs));
};

export default setupSwagger;