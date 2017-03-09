const Koa = require('koa');
const app = new Koa();
const logger = require('koa-logger');
const bodyParser = require('koa-bodyparser');
const fetch = require('./utils/fetch');
const router = require('koa-router')({
	prefix: '/cloud'
});

var registerTable = {};

setInterval(()=>{
	Object.keys(registerTable).forEach(async service_name=>{
		let service_port = registerTable[service_name].port;
		fetch(`http://localhost:${service_port}/${service_name}/watchdog`)
		.catch(error=>{
			registerTable[service_name].errorNum++;
			console.error(`${service_name} 服务出现了问题，请检查`);
			if(registerTable[service_name].errorNum > 3) {
				delete registerTable[service_name];
				console.error(`${service_name} 长时间未响应，已移除`);
			}
		})
	})
}, 6000);

router.post('/register/:service_name', context=>{
	let service_name = context.params.service_name;
	let service_port = context.request.body.port;
	let isUpdateServiceConfig = !!registerTable[service_name];

	registerTable[service_name] = {
		port: service_port,
		errorNum: 0
	};

	context.response.body = {
		code: 0,
		message: isUpdateServiceConfig?'微服务配置更新成功':'微服务配置已注册'
	};

	console.log(`${service_name} 服务注册成功，端口${service_port}`);
})

router.get('/status', context=>{
	context.response.body = registerTable;
})

router.all('*', async context=>{
	console.log(context.request.path);
	let service_name = context.request.path.match(/^\/cloud\/(.*)\//);
	if(service_name == null) {
		context.response.body = {
			code: -1,
			message: '未提供服务名称'
		}
		return;
	}

	service_name = service_name[1];
	console.log(service_name);
	if(!registerTable[service_name]) {
		context.response.body = {
			code: -2,
			message: '所需要的微服务未注册'
		}
		return;
	}

	let service = registerTable[service_name];

	var ret = await fetch(`http://localhost:${service.port}/${context.request.path.replace(/^\/cloud/, '')}`, {
		method: context.request.method,
		body: context.request.body
	})
	context.response.body = ret;
})



app.use(logger()).use(bodyParser()).use(router.routes()).use(router.allowedMethods());
app.listen(3000);