const express = require('express');
const app = express();
const PORT = 3000;

/**
 * Generates a string of a specified size in kilobytes.
 * @param {number} sizeInKb The desired size in KB.
 * @returns {string} A string of the specified size.
 */
const generatePayload = (sizeInKb) => {
  const bytes = sizeInKb * 1024;
  // We use a single character 'a' repeated to create the payload.
  return 'a'.repeat(bytes);
};

// Route for a 10KB payload
app.get('/small-payload', (req, res) => {
  console.log('Request received for /small-payload');
  const payload = generatePayload(10);
  res.setHeader('Content-Type', 'text/plain');
  res.send(payload);
});

// Route for a 500KB payload
app.get('/large-payload', (req, res) => {
  console.log('Request received for /large-payload');
  const payload = generatePayload(500);
  res.setHeader('Content-Type', 'text/plain');
  res.send(payload);
});

app.listen(PORT, () => {
  console.log(`🧑‍💻 Server is running on http://localhost:${PORT}`);
});