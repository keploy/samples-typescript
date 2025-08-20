const express = require('express');
const app = express();
const PORT = 3000;

/**
 * Generates an array of JSON objects to approximate a specified size in kilobytes.
 * @param {number} targetSizeInKb The desired size in KB.
 * @returns {Array<object>} An array of JSON objects.
 */
const generateJsonPayload = (targetSizeInKb) => {
  const targetSizeBytes = targetSizeInKb * 1024;

  const sampleObject = {
    id: 0,
    user: "sample_user",
    email: "user@example.com",
    isActive: true,
    data: "This is a sample object used to create a JSON payload of a specific size.",
    timestamp: "2025-08-20T12:52:18.000Z"
  };

  const singleObjectString = JSON.stringify(sampleObject);
  const sizeOfUnit = Buffer.byteLength(singleObjectString, 'utf8') + 1;
  const numberOfObjects = Math.floor(targetSizeBytes / sizeOfUnit);

  const payloadArray = [];
  for (let i = 0; i < numberOfObjects; i++) {
    payloadArray.push({
      id: i + 1,
      user: "sample_user",
      email: "user@example.com",
      isActive: true,
      data: "This is a sample object used to create a JSON payload of a specific size.",
      timestamp: new Date().toISOString()
    });
  }
  return payloadArray;
};

// Route for a 10KB payload (remains a GET request)
app.get('/small-payload', (req, res) => {
  console.log('Request received for /small-payload');
  const payload = generateJsonPayload(10);
  res.json(payload);
});

// Route for a 500KB payload (changed to a POST request)
app.post('/large-payload', (req, res) => {
  console.log('Request received for /large-payload');
  // The server will still send its own 500KB response, ignoring the request body.
  const payload = generateJsonPayload(500);
  res.json(payload);
});

app.listen(PORT, () => {
  console.log(`🧑‍💻 Server is running on http://localhost:${PORT}`);
});