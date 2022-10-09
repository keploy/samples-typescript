require("typescript-sdk/dist/integrations/express/register"); // Require the express hook
require("typescript-sdk/dist/integrations/node-fetch/require") // Require the node-fetch hook
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

var server = app.listen(3000,() =>
console.log(`Example app listening on port 3000!`));
module.exports = server;