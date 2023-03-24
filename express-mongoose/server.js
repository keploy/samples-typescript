// Require hooks for keploy integration. This should be before require statements of packages
require("typescript-sdk/dist/integrations/express/register"); // express require hooks for keploy integratation 
require("typescript-sdk/dist/integrations/mongoose/require")  // mongoose require hook for keploy integration

var express = require('express');
const mongoose = require('mongoose');
const user = require('./mongo_schema');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/keploy', { useNewUrlParser: true, useUnifiedTopology: true })
.then(() => console.log('MongoDB Connected'))
.catch(err => console.log(err));

var app = express();    

// Get route to get data from MongoDB
app.get('/getData', function (re, rs) {
    console.log("GET request at /getData route");
    user.find({name: re.body.name})
    .then(data => JSON.stringify(data))
    .then(text => rs.send(text));
});

// Post route to save data in MongoDB
app.post('/postData', function (re, rs) {
    console.log("POST request at /postData route");
    console.log(re.body);
    const newUser = new user(re.body);
    newUser.save()
    .then(data => JSON.stringify(data))
    .then(text => rs.send(text));
});

// Patch route to update data in MongoDB
app.patch('/updateData', function (re, rs) {
    console.log("PATCH request at /updateData route");
    console.log(re.body);
    user.findOneAndUpdate({name: re.body.name}, re.body)
    .then(data => JSON.stringify(data))
    .then(text => rs.send(text));
});

// Delete route to delete data from MongoDB
app.delete('/deleteData', function (re, rs) {
    console.log("DELETE request at /deleteData route");
    console.log(re.body);
    user.findOneAndDelete({name: re.body.name})
    .then(data => JSON.stringify(data))
    .then(text => rs.send(text));
});

var server = app.listen(process.env.KEPLOY_APP_PORT,() =>
    console.log(`Example app listening on port ${process.env.KEPLOY_APP_PORT}!`)
);
module.exports = server;