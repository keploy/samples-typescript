import { Elysia } from 'elysia'
import HelloController from './controller/hello'
import * as mongoose from 'mongoose';
import MongoIntegration from './controller/fetch'
import cors from '@elysiajs/cors';

const app = new Elysia()

app.use(cors())



app.get('/hello', async() => {
    const controller = new HelloController();
    console.log("GET request at /hello route");
    return (controller.sayHello());
});

app.get('/fetch', async() => {
    const controller = new MongoIntegration();
    console.log("GET request at /fetch route");
    return (controller.Fetch());
});

app.post('/save', async() => {
    const controller = new MongoIntegration();
    console.log("POST request at /save route");
    return (controller.Save());
});

app.put('/put', async() => {
    const controller = new MongoIntegration();
    console.log("PUT request at /put route");
    return (controller.Put());
});

app.delete('/delete', async() => {
    const controller = new MongoIntegration();
    console.log("DELETE request at /delete route");
    return (controller.Delete());
});

mongoose.connect('mongodb://localhost:27017/keploy', { 
    serverSelectionTimeoutMS: 5000
}).then(() => {
    app.listen(4200, () => console.log(`Elysia is running on port 4200...`));
}).catch(err => console.error('Failed to connect to MongoDB', err));

app.listen("4200")


console.log(`Elysia is running at on port ${app.server?.port}...`)
