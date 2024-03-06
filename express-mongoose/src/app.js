const express = require('express');
require('./db/connection');
const Student = require('./models/students');
const router = require('./routes/routes');
const os = require('os');
const https = require('https');
const fs = require('fs');

const app = express();

const options = {
    key: fs.readFileSync('./key.pem'),
    cert: fs.readFileSync('./cert.pem')
};


app.use(express.json());
app.use(router);

// https.createServer(options, app).listen(443, () => {
// //   console.log('Server running on port 443');
//     const username = os.userInfo().username;
//     console.log("printing the env variable from the main ts file", username)
//     console.log(`Listening on port 443`);
// });
app.listen(8000, () => {
    // process.env.NODE_EXTRA_CA_CERTS = "/tmp/ca.crt1689405466"
    const username = os.userInfo().username;
    console.log("printing the env variable from the main ts file", username)
    console.log(`Listening on port 8000`);
})