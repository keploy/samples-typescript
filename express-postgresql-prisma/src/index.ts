import express from 'express';
import dotenv from 'dotenv';
import bodyParser from 'body-parser';

dotenv.config();

const PORT = process.env.PORT

const app = express();

app.use(bodyParser.json());

app.listen(PORT, ()=>{
    console.log(`Server is listening at PORT ${PORT}

    Server: http://localhost:${PORT}
    API Docs: http://localhost:${PORT}/api-docs
    `);
});