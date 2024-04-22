const db = require("../models");
const User = db.user;

exports.allAccess = (req, res) => {
    res.status(200).send("Public Content.");
};
  
  exports.userBoard = (req, res) => {
    res.status(200).send("User Content.");
};
  
  exports.adminBoard = (req, res) => {
    res.status(200).send("Admin Content.");
};
  
  exports.moderatorBoard = (req, res) => {
    res.status(200).send("Moderator Content.");
};

exports.updateRole = (req, res) => {
    const { userId } = req.params;
    const { role } = req.body;
  
    User.update(
      { role: role },
      { where: { id: userId } }
    )
    .then(num => {
      if (num == 1) {
        res.send({ message: "User role was updated successfully." });
      } else {
        res.send({ message: `Cannot update user with id=${userId}. User may not exist or request body may be empty.` });
      }
    })
    .catch(err => {
      res.status(500).send({ message: "Error updating user role." });
    });
  };
  
  exports.deleteUser = (req, res) => {
    const { userId } = req.params;
  
    User.destroy({
      where: { id: userId }
    })
    .then(num => {
      if (num == 1) {
        res.send({ message: "User was deleted successfully." });
      } else {
        res.send({ message: `Cannot delete user with id=${userId}. User may not exist.` });
      }
    })
    .catch(err => {
      res.status(500).send({ message: "Error deleting user." });
    });
};

exports.getAllUsers = (req, res) => {
    User.findAll()
      .then(users => {
        res.status(200).send(users);
      })
      .catch(err => {
        res.status(500).send({ message: err.message });
      });
  };