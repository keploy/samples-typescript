const mongoose = require('mongoose');

// mongoose.connect('mongodb://127.0.0.1:27017/Students') // when using natively
mongoose.connect('mongodb://mongoDb:27017/Students') // When using with docker
.then(() => console.log("Connected to MongoDB"))
.catch(err=>console.error(`Error connecting to mongoDB ${err}`));
