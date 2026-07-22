const redis = require('redis');

let redisClient = null;

if (process.env.REDIS_URL) {
  try {
    redisClient = redis.createClient({ 
      url: process.env.REDIS_URL,
      socket: {
        // Stop waiting after 3 seconds if connection hangs
        connectTimeout: 3000, 
        // Fail-Fast: Stop retry loop after 3 attempts
        reconnectStrategy: (retries) => {
          if (retries >= 3) {
            console.warn('Redis unresponsive: Max retries reached. Bypassing cache.');
            return new Error('Max Redis retries reached.');
          }
          return 1000; 
        }
      }
    });

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