const { authJwt } = require("../middleware");
const controller = require("../controllers/user.controller");

module.exports = function(app) {
  app.use(function(req, res, next) {
    res.header(
      "Access-Control-Allow-Headers",
      "Origin, Content-Type, Accept"
    );
    next();
  });

  app.get("/api/test/all", controller.allAccess);
  app.get("/api/users", [authJwt.verifyToken, authJwt.isAdmin], controller.getAllUsers);
  app.get(
    "/api/test/user",
    [authJwt.verifyToken],
    controller.userBoard
  );

  app.get(
    "/api/test/mod",
    [authJwt.verifyToken, authJwt.isModerator],
    controller.moderatorBoard
  );

  app.get(
    "/api/test/admin",
    [authJwt.verifyToken, authJwt.isAdmin],
    controller.adminBoard
  );
  app.put("/api/user/:userId/updateRole", 
    [authJwt.verifyToken, authJwt.isAdmin], 
    controller.updateRole
  );
  app.delete("/api/user/:userId", 
    [authJwt.verifyToken, authJwt.isModeratorOrAdmin], 
    controller.deleteUser
  );
};