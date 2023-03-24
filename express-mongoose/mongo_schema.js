require("typescript-sdk/dist/integrations/mongoose/require")  // mongoose require hook for keploy integration

const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name: String,
    job: String
});

const user = mongoose.model('users', userSchema);
module.exports = user;