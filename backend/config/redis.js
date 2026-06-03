const redis = require('redis');

let redisClient = null;

if (process.env.REDIS_URL) {
  try {
    redisClient = redis.createClient({ url: process.env.REDIS_URL });
    
    redisClient.on('error', (err) => {
      console.warn('Redis warning: Cache safely bypassed.');
    });

    redisClient.connect()
      .then(() => {
        console.log('✅ Redis connected successfully.');
      })
      .catch((err) => {
        console.error('Redis asynchronous connection failed:', err);
      });
  } catch (err) {
    console.error('Redis initialization failed:', err);
    redisClient = null;
  }
}

module.exports = redisClient;