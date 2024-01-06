const redis = require('redis');

const client = redis.createClient();

exports.cacheMiddleware = (req, res, next) => {
    const key = req.originalUrl;
    const ttlInSeconds = 60;  // Set the TTL to 60 seconds (adjust as needed)
  
    client.get(key, (err, data) => {
      if (err) {
        console.error('Redis cache error:', err);
        next();
        return;
      }
  
      if (data !== null) {
          res.status(200).json(JSON.parse(data));

      } else {
          client.setex(key, ttlInSeconds, JSON.stringify(data));
          console.log("data is cached")
        next();
      }
    });
  };

exports.clearCache = () => {
  client.flushDb();
};
