const http = require('http');
const Koa = require('koa');
const app = new Koa();
const router = require('koa-router')({
	prefix: '/webhook'
});
const logger = require('koa-logger');
const bodyParser = require('koa-bodyparser');
const fetch = require('node-fetch');

const config = require('./config.js')('webhook');
const tjyy8Service = require('./service/tjyy8');
const microService = require('./utils/microService');

var app_port = 0;

router.get('/watchdog', context => {
	context.response.body = {
		code: 0
	}
});

router.post('/spider/tjyy8', async function(context) {
	var {
		url,
		timestamp,
		sign2,
		data,
		event_type,
		crawl_time,
		data_key
	} = context.request.body;
	data = JSON.parse(data);

	console.log(data);

	var res = await fetch('http://localhost:3000/wechat/send', {
		method: 'POST',
		headers: {
			'content-type': 'application/json'
		},
		body: JSON.stringify({
			type: 'tjyy8_newPerformance',
			message: tjyy8Service.getTemplateMessage(url, data)
		})
	});
	console.log(await res.json());

	context.response.body = data_key;
})

app.use(logger()).use(bodyParser()).use(router.routes()).use(router.allowedMethods());

var server = http.createServer(app.callback()).listen(0, '127.0.0.1', ()=>{
	app_port = server.address().port;
	microService.register('webhook', app_port);
	console.log(`webhook service has been listened at port ${app_port}`);
});

