const Joi = require("joi");

const productSchema = {
  create: Joi.object({
    name: Joi.string().min(3).max(100).required(),
    quantity: Joi.number().integer().min(0).required(),
    price: Joi.number().precision(2).min(0).max(1000000).required(),
    image: Joi.string().uri().optional(),
    category: Joi.string().optional(),
  }),

  update: Joi.object({
    name: Joi.string().min(3).max(100).optional(),
    quantity: Joi.number().integer().min(0).optional(),
    price: Joi.number().precision(2).min(0).max(1000000).optional(),
    image: Joi.string().uri().optional(),
    category: Joi.string().optional(),
  }).min(1),
};

const validateProduct = (type) => (req, res, next) => {
  const { error } = productSchema[type].validate(req.body);
  if (error) {
    return res.status(400).json({
      error: error.details.map((e) => e.message),
    });
  }
  next();
};

module.exports = { validateProduct };
