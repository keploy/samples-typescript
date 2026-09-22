const express = require("express");
const cors = require("cors");
// const kmiddleware = require('@keploy/sdk/dist/v2/dedup/middleware.js')

const app = express();
// app.use(kmiddleware())


var corsOptions = {
  origin: "http://localhost:8081"
};

const db = require("./models");
const Role = db.role;

// Listen only once the schema AND the seed roles exist. app.listen() used to
// run immediately, while sequelize.sync() was still creating the tables, so
// for the first second or so the server answered every DB-backed route with
// a 500 ("relation \"users\" does not exist") -- and signup, which sets role
// id 1 on the new user, would have hit the user_roles foreign key until
// initial() had inserted it. Anything probing the app for readiness during
// that window (Keploy's CI does, on /api/users, while recording) captured
// that 500 as a real response.
const PORT = process.env.PORT || 8080;
db.sequelize.sync()
  .then(() => {
    console.log('Synchronized Db');
    return initial();
  })
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}.`);
    });
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

function initial() {
  return Promise.all([
  Role.create({
    id: 1,
    name: "user"
  }).catch(error => {
    if (error.name === 'SequelizeUniqueConstraintError') {
      console.log('Role with ID 1 already exists. Skipping creation.');
    } else {
      console.error('Error creating role:', error);
    }
  }),

  Role.create({
    id: 2,
    name: "moderator"
  }).catch(error => {
    if (error.name === 'SequelizeUniqueConstraintError') {
      console.log('Role with ID 2 already exists. Skipping creation.');
    } else {
      console.error('Error creating role:', error);
    }
  }),

  Role.create({
    id: 3,
    name: "admin"
  }).catch(error => {
    if (error.name === 'SequelizeUniqueConstraintError') {
      console.log('Role with ID 3 already exists. Skipping creation.');
    } else {
      console.error('Error creating role:', error);
    }
  }),
  ]);
}