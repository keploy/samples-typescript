const jwt = require("jsonwebtoken");
const User = require("./models/users");
const Note = require("./models/model");
const logger = require("./utils/logger");

const createToken = (id) => {
  logger.debug(`Creating token for user ID: ${id}`);
  return jwt.sign({ id }, "MONKE", { expiresIn: 24 * 60 * 60 });
};

module.exports.createToken = createToken;

module.exports.checkUser = (req, res, next) => {
  const token = req.cookies.jwt;
  if (token) {
    jwt.verify(token, "MONKE", async (err, decToken) => {
      if (err) {
        logger.warn(`Invalid JWT token: ${err.message}`);
        res.locals.user = null;
        next();
      } else {
        logger.debug(`Valid token for user ID: ${decToken.id}`);
        try {
          let user = await User.findById(decToken.id);
          if (!user) {
            logger.warn(`User not found for ID: ${decToken.id}`);
            res.locals.user = null;
          } else {
            logger.debug(`Authenticated user: ${user.username}`);
            res.locals.user = user;
          }
          next();
        } catch (err) {
          logger.error(`User lookup error: ${err.message}`);
          res.locals.user = null;
          next();
        }
      }
    });
  } else {
    logger.debug("No JWT token found, redirecting to signup");
    res.redirect("/signup");
  }
};

module.exports.showNotes = (req, res) => {
  const token = req.cookies.jwt;
  jwt.verify(token, "MONKE", async (err, decoded) => {
    if (err) {
      logger.warn(`Invalid token in showNotes: ${err.message}`);
      res.redirect("/login");
    } else {
      try {
        const user = await User.findById(decoded.id);
        if (!user) {
          logger.warn(`User not found for ID: ${decoded.id}`);
          return res.redirect("/login");
        }

        logger.debug(`Fetching notes for user: ${user.username}`);
        const notes = await Note.find({ username: user.username });
        
        logger.debug(`Found ${notes.length} notes for user`);
        res.render("index", { result: notes });
      } catch (err) {
        logger.error(`Error in showNotes: ${err.message}`);
        res.status(500).render("error", { message: "Error loading notes" });
      }
    }
  });
};

module.exports.signIn = async (req, res) => {
  const { username, password } = req.body;
  logger.debug(`Signup attempt for username: ${username}`);
  
  try {
    const user = await User.create({ username, password });
    logger.info(`New user created: ${username}`);
    
    const token = createToken(user._id);
    res.cookie("jwt", token, { 
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000 
    });
    
    logger.debug(`Session cookie set for user: ${username}`);
    res.redirect("/");
  } catch (err) {
    logger.error(`Signup error for ${username}: ${err.message}`);
    
    // Handle specific error cases
    if (err.code === 11000) {
      logger.warn(`Duplicate username attempt: ${username}`);
      return res.render("signup", { error: "Username already exists" });
    }
    
    res.status(500).render("signup", { 
      error: "Registration failed. Please try again." 
    });
  }
};

module.exports.logIn = async (req, res) => {
  const { username, password } = req.body;
  logger.debug(`Login attempt for username: ${username}`);
  
  try {
    const user = await User.login(username, password);
    logger.info(`Successful login for user: ${username}`);
    
    const token = createToken(user._id);
    res.cookie("jwt", token, { 
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000 
    });
    
    logger.debug(`Session cookie set for user: ${username}`);
    res.redirect("/");
  } catch (err) {
    logger.warn(`Failed login attempt for ${username}: ${err.message}`);
    
    // Differentiate between wrong password and non-existent user
    const errorMessage = err.message.includes("incorrect password") 
      ? "Incorrect password"
      : "User not found";
    
    res.status(401).render("login", { 
      error: errorMessage,
      username: username // Return username for convenience
    });
  }
};

module.exports.logout = (req, res) => {
  logger.debug("Logout request received");
  res.cookie("jwt", "", { 
    httpOnly: true,
    maxAge: 1 
  });
  logger.info("User logged out, session cleared");
  res.redirect("/login");
};