const express = require('express');
require('./db/connection');
const Student = require('./models/students');
const router = require('./routes/routes');

const app = express();

app.use(express.json());
app.use(router);

app.listen(8000, () => {
    console.log(`Listening on port 8000`);
})