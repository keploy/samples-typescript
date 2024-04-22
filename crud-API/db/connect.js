const mongoose = require('mongoose');

const connectDB = (uri) => {  // pass the parameter in app.js
    console.log("connect database");
    return mongoose.connect(uri);
};

module.exports = connectDB;