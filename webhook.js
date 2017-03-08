const Koa = require('koa');
const app = new Koa();
const router = require('koa-router')();
const logger = require('koa-logger');
const bodyParser = require('koa-bodyparser');
const fetch = require('node-fetch');

const config = require('./config.js')('webhook');



app.use(logger()).use(bodyParser()).use(router.routes()).use(router.allowedMethods());
app.listen(config.port);
console.log('webhook service has been listened at port '+config.port);
