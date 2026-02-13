const validateCourse = (req, res, next) => {
  // Only validate for POST and PUT requests
  if (req.method === 'GET' || req.method === 'DELETE') {
    return next();
  }

  const { title, description, price } = req.body;

  const errors = [];

  if (!title || title.trim().length < 3) {
    errors.push('Title is required and must be at least 3 characters long');
  }

  if (!description || description.trim().length < 10) {
    errors.push('Description is required and must be at least 10 characters long');
  }

  if (!price || isNaN(price) || price < 0) {
    errors.push('Price is required and must be a positive number');
  }

  if (errors.length > 0) {
    return res.status(400).json({ errors });
  }

  next();
};

module.exports = validateCourse; 