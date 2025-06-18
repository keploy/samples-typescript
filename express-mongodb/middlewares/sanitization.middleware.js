const xss = require("xss-clean");
const mongoSanitize = require("express-mongo-sanitize");

// XSS protection
const sanitizeInput = [xss(), mongoSanitize()];

module.exports = { sanitizeInput };
