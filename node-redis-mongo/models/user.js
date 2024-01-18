const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: String,
  email: String,
  todos: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Todo' }],
});

const User = mongoose.model('User', userSchema);

module.exports = User;
