const express = require('express');
const mongoose = require('mongoose');
const TodoController = require('./controllers/todo-controller');
const UserController = require('./controllers/user-controller');
const CacheController = require('./controllers/cache-controller');

const app = express();
const PORT = 3000;

mongoose.connect('mongodb://127.0.0.1:27017/TodoDB', { useNewUrlParser: true, useUnifiedTopology: true });
const db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));

app.use(express.json());

app.post('/todos', TodoController.createTodo);
app.get('/todos', CacheController.cacheMiddleware, TodoController.getTodos);
app.get('/todos/:id', CacheController.cacheMiddleware, TodoController.getTodoById);
app.put('/todos/:id', TodoController.updateTodo);
app.delete('/todos/:id', TodoController.deleteTodo);

app.post('/users', UserController.createUser);
app.get('/users', UserController.getUsers);
app.get('/users/:id', UserController.getUserById);
app.put('/users/:id', UserController.updateUser);
app.delete('/users/:id', UserController.deleteUser);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
