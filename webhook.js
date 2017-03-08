const Koa = require('koa');
const app = new Koa();
const router = require('koa-router')();
const logger = require('koa-logger');
const bodyParser = require('koa-bodyparser');
const fetch = require('node-fetch');

const config = require('./config.js')('webhook');

router.post('/webhook/spider/tjyy8', async function(context) {
	console.log(context.request.body);
	console.log('===========================');
	console.log(JSON.stringify(context.request.body));

	context.response.body = context.request.body.data_key;
})

app.use(logger()).use(bodyParser()).use(router.routes()).use(router.allowedMethods());
app.listen(config.port);
console.log('webhook service has been listened at port '+config.port);
