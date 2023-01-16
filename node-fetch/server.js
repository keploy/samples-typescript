// Require hooks for keploy integration. This should be before require statements of packages
require("typescript-sdk/dist/integrations/express/register"); // express require hooks for keploy integratation 
require("typescript-sdk/dist/integrations/node-fetch/require") // node-fetch require hook for keploy integration

var express = require('express');
const fetch = require("node-fetch")

var app = express();    

// Get route to get the sample data
app.get('/getData', function (re, rs) {
    console.log("GET request at /getData route");
    fetch('https://reqres.in/api/users/2')
    .then(res => res.text())
    .then(text => rs.send(text));
});

// Post route to post the data in json format
app.post('/postData', function (re, rs) {
    console.log("POST request at /postData route");
    console.log(re.body);
    fetch("https://reqres.in/api/users",
    {
        method: "POST",
        body: JSON.stringify(re.body)
    })
    .then(res => res.text())
    .then(text => rs.send(text));
});

var server = app.listen(8080,() =>
console.log(`Example app listening on port 8080!`));
module.exports = server;