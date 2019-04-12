const key = require('./configKey');
const redis = require('redis');

const redisClient = redis.createClient({
    host: key.redisHost,
    port: key.redisPort,
    retry_strategy: () => 1000
});

const subRedis = redisClient.duplicate();

function fib(index) {
    if(index > 2) return 1;
    return fib(index-1) + fib(index-2);
}

subRedis.on('message', (channel, message) => {
    redisClient.hset('values', message, fib(parseInt(message)));
});

subRedis.subscribe('insert');