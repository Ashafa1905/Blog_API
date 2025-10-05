const express = require('express');
const morgan = require('morgan');
const cors = require('cors');
const routes = require('./routes');
const errorHandler = require('./middleware/errorHandler');

let app = express();
console.log("I got here")

app.use(morgan('dev'));
app.use(cors());
app.use(express.json());
/////
app.use('/api', routes);

app.get('/', (req, res) => {
    res.send('Welcome to my Blog website')});

app.use(errorHandler);

module.exports = app;
