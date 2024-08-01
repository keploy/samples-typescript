const app = require("./app");

const port = process.env.PORT || 3000;

const server = app.listen(port, () => {
  console.log(`Listening at port ${port}`);
});

server.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`Port ${port} is already in use. Please use a different port.`);
    process.exit(1);
  } else {
    throw error;
  }
});

module.exports = server;
