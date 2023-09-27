import { Elysia } from 'elysia'
import HelloController from './controller/hello'
import * as mongoose from 'mongoose';
import MongoIntegration from './controller/fetch'
import cors from 'cors';

const app = new Elysia()

app.use(cors())

app.get('/hello', () => {
    const controller = new HelloController();
    console.log("GET request at /hello route");
    return (controller.sayHello());
});

app.get('/fetch', () => {
    const controller = new MongoIntegration();
    console.log("GET request at /fetch route");
    return (controller.Fetch());
});

app.post('/save', () => {
    const controller = new MongoIntegration();
    console.log("POST request at /save route");
    return (controller.Save());
});

app.put('/put', () => {
    const controller = new MongoIntegration();
    console.log("PUT request at /put route");
    return (controller.Put());
});

app.delete('/delete', () => {
    const controller = new MongoIntegration();
    console.log("DELETE request at /delete route");
    return (controller.Delete());
});

mongoose.connect('mongodb://mongoDb-bun:27017/keploy', { 
    serverSelectionTimeoutMS: 5000  // timeout after 5 seconds
})

app.listen("420")


console.log(`Elysia is running at on port ${app.server?.port}...`)
