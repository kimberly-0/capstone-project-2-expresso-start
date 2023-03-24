const express = require('express');
const bodyParser = require('body-parser');
const errorhandler = require('errorhandler');

const app = express();
const PORT = process.env.PORT || 4000;

app.use(bodyParser.json());
app.use(errorhandler());

const apiRouter = require('./api/api');
app.use('/api', apiRouter);

app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
});

module.exports = app;