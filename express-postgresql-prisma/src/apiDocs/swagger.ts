import { Application } from 'express';
import swaggerJsDoc from 'swagger-jsdoc';
import swaggerUI from 'swagger-ui-express';
import YAML from 'yamljs';
import path from 'path';

const add = YAML.load(path.join(__dirname, '../../swaggerDocsRouteConfig/add.yaml'));
const updateId = YAML.load(path.join(__dirname, '../../swaggerDocsRouteConfig/updateId.yaml'));
const deleteId = YAML.load(path.join(__dirname, '../../swaggerDocsRouteConfig/deleteId.yaml'));
const view = YAML.load(path.join(__dirname, '../../swaggerDocsRouteConfig/view.yaml'));
const viewId = YAML.load(path.join(__dirname, '../../swaggerDocsRouteConfig/viewId.yaml'));
const changePriority = YAML.load(path.join(__dirname, '../../swaggerDocsRouteConfig/ChangePriority.yaml'));

const swaggerDocument = {
    openapi: "3.0.0",
    info: {
        title: "Task Management API",
        version: "1.0.0",
        description: "An API to manage personal or team tasks, built with Express, PostgreSQL, and Prisma."
    },
    paths: {
        ...add.paths,
        ...updateId.paths,
        ...deleteId.paths,
        ...view.paths,
        ...viewId.paths,
        ...changePriority.paths
    },
};

const specs = swaggerJsDoc({
    definition: swaggerDocument,
    apis: ["./src/routes/*.ts"]
});

const setupSwagger = (app: Application) => {
    app.use("/api/docs", swaggerUI.serve, swaggerUI.setup(specs));
};

export default setupSwagger;
