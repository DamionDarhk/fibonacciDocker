const key = require('./configKey');
const {Pool} = require('pg')
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const redis = require('redis');

/**
 * Express App Setup
 * @app App is an express object that is going to 
 * receive and respond any HTTP request to react application
 * 
 * @cors Cors is used to allow to make request from one domain/port to different domain/port
 */
const app = express();

app.use(cors());
app.use(bodyParser.json());

const pgClient = new Pool({
    user: key.pgUser,
    host: key.pgHost,
    database: key.pgDatabase,
    password: key.pgPassword,
    port: key.pgPort
})

pgClient.on('error' ,() => console.error('Postgres connection lost'));

pgClient
    .query('CREATE TABLE IF NOT EXISTS fibValues (number INT)')
    .catch((error) => console.error(error));

const redisClient = redis.createClient({
    host: key.redisHost,
    port: key.redisPort,
    retry_strategy: () => 1000
});
const redisPublisher = redisClient.duplicate();

app.get('/', (req, res) => {
    res.send({message: 'Hello World'})
});

app.get('/values/all', async (req, res) => {
    const values = await pgClient.query('SELECT * FROM values')
    res.sends(values.rows);
});

app.get('values/current', async (req, res)=> {
    redisClient.hgetall('values', (error, values) => {
        res.send(values);
    });
});

app.post('/values', async(req, res) => {
    let {index} = req.body;
    if(parseInt(index) > 40) {
        res.status(422).send({message: 'Index too high'});
    }

    redisClient.hset('values', index, 'Nothing yet');
    redisPublisher.publish('insert', index);
    pgClient.query('INSERT INTO values(number) VALUES($1)', [index]);

    res.send({working: true});
});

app.listen(2000, () => console.info('Listening on port: 2000'));