const express = require("express");
const cors = require("cors");

const app = express();

var corsOptions = {
  origin: "http://localhost:8081"
};

const db = require("./models");
const Role = db.role;

db.sequelize.sync().then(() => {
  console.log('Synchronized Db');
  initial();
});

app.use(cors(corsOptions));

// parse requests of content-type - application/json
app.use(express.json());

// parse requests of content-type - application/x-www-form-urlencoded
app.use(express.urlencoded({ extended: true }));

// simple route
app.get("/", (req, res) => {
  res.json({ message: "Welcome to bezkoder application." });
});

require('./routes/auth.routes')(app);
require('./routes/user.routes')(app);
// set port, listen for requests
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}.`);
});

function initial() {
  Role.create({
    id: 1,
    name: "user"
  }).catch(error => {
    if (error.name === 'SequelizeUniqueConstraintError') {
      console.log('Role with ID 1 already exists. Skipping creation.');
    } else {
      console.error('Error creating role:', error);
    }
  });
 
  Role.create({
    id: 2,
    name: "moderator"
  }).catch(error => {
    if (error.name === 'SequelizeUniqueConstraintError') {
      console.log('Role with ID 2 already exists. Skipping creation.');
    } else {
      console.error('Error creating role:', error);
    }
  });
 
  Role.create({
    id: 3,
    name: "admin"
  }).catch(error => {
    if (error.name === 'SequelizeUniqueConstraintError') {
      console.log('Role with ID 3 already exists. Skipping creation.');
    } else {
      console.error('Error creating role:', error);
    }
  });
}