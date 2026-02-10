const express = require('express');
const jwt = require('jsonwebtoken');
const app = express();
const port = 8080;

const JWT_KEY = 'my_super_secret_key';

// /login endpoint to generate a JWT
app.post('/login', (req, res) => {
    console.log(`Login attempt at: ${new Date()}`);

    // Token expires in 2 minutes (120 seconds)
    const expirationTime = Math.floor(Date.now() / 1000) + (2 * 60);

    const payload = {
        username: 'testuser',
        exp: expirationTime,
    };

    const token = jwt.sign(payload, JWT_KEY, { algorithm: 'HS256' });
    
    // Create a JavaScript object to be sent as JSON
    const response = {
        token: token,
    };

    // Send the object as a JSON response.
    // .json() sets the status to 200 by default.
    res.json(response);
});

// Middleware to insecurely check token expiry
const insecureExpiryOnlyMiddleware = (req, res, next) => {
    console.log(`Time now: ${Math.floor(Date.now() / 1000)}`);
    const authHeader = req.headers['authorization'];

    if (!authHeader) {
        return res.status(401).send('Authorization header required');
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
        return res.status(401).send('Malformed token');
    }

    // Insecurely decode the token to check expiry without verifying the signature
    const decodedToken = jwt.decode(token);

    if (!decodedToken || !decodedToken.exp) {
        return res.status(401).send('Malformed token');
    }

    if (decodedToken.exp < Math.floor(Date.now() / 1000)) {
        return res.status(401).send(`Token is expired. Current timestamp: ${Math.floor(Date.now() / 1000)}`);
    }

    next();
};

// /protected endpoint
app.get('/protected', insecureExpiryOnlyMiddleware, (req, res) => {
    res.status(200).send('Welcome to the protected area!');
});

// /check-time endpoint checks if a client-provided timestamp is within 1 second of the server time.
// The timestamp should be provided as a Unix timestamp in the 'ts' query parameter.
app.get('/check-time', (req, res) => {
    // 1. Get the timestamp string from the URL query parameter 'ts'
    const clientTimeStr = req.query.ts;
    if (!clientTimeStr) {
        return res.status(400).json({ error: "Missing 'ts' query parameter" });
    }

    // 2. Parse the string into an integer (Unix timestamp in seconds)
    const clientTimestamp = parseInt(clientTimeStr, 10);
    if (isNaN(clientTimestamp)) {
        return res.status(400).json({ error: "Invalid timestamp format. Must be a Unix timestamp in seconds." });
    }

    // 3. Get the current server time as a Unix timestamp in seconds
    const serverTimestamp = Math.floor(Date.now() / 1000);

    // 4. Calculate the absolute difference in seconds
    const diff = Math.abs(serverTimestamp - clientTimestamp);
    
    console.log(`Server Time: ${serverTimestamp}, Client Time: ${clientTimestamp}, Difference: ${diff}s`);

    // 5. Check if the difference is greater than 1 second
    if (diff > 1) {
        return res.sendStatus(400);
    }

    // 6. If the check passes, wait for 1 second before sending a 200 OK response
    setTimeout(() => {
        res.sendStatus(200);
    }, 1000); // 1000 milliseconds = 1 second
});

app.listen(port, () => {
    console.log(`Current time: ${Math.floor(Date.now() / 1000)}`);
    console.log(`Server starting on port ${port}...`);
});