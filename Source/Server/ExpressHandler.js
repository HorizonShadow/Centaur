require('reflect-metadata');
require('dotenv').config();
require('./Sequelize');
require('../Models/User');
const path = require('path');
const express = require('express');
const app = express();
require('express-ws')(app);
const Dispatcher = require('./Dispatcher');
const dispatch = new Dispatcher();

app.use('/', (req, res, next) => {
  console.log(req.url);
  next();
});

app.use('/', express.static(path.resolve('dist')));

app.ws('/ws', function(ws, req) {
  ws.on('message', function(msg) {
    try {
      const parsedMessage = JSON.parse(msg);
      ws.setMaxListeners(500000);

      dispatch.start(ws, parsedMessage);
    } catch (e) {
      console.error(e);
    }
  });

  ws.on('close', function() {
    dispatch.removeConnection(ws);
  });
});

app.listen(3000);
