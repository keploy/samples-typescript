import express from 'express';
import dotenv from 'dotenv';
import bodyParser from 'body-parser';
import mainRouter from './routes/mainRouter';
import setupSwagger from './apiDocs/swagger';

dotenv.config();

const PORT = process.env.PORT

const app = express();

app.use(bodyParser.json());
app.use('/api/v1', mainRouter);

setupSwagger(app);

app.listen(PORT, ()=>{
    console.log(`Server is listening at PORT ${PORT}

    Server: http://localhost:${PORT}
    API Docs: http://localhost:${PORT}/api/docs
    `);
});