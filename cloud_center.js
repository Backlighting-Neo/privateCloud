const fs = require('fs');
const Koa = require('koa');
const app = new Koa();
const logger = require('koa-logger');
const bodyParser = require('koa-bodyparser');
const fetch = require('./utils/fetch');
const router = require('koa-router')();
const winston_logger = require('./utils/log.js');

var logger = winston_logger({
	level: 'info',
	fileLevel: 'info',
	filename: path.resolve('../', 'logs', 'cloud_center'),
	wrireFileDirName: path.resolve('../', 'logs', 'cloud_center_file_log'), //写文件的logs
});

const WATCH_DOG_TIME = 60000;
const SERVICE_KEY_WORD = ['register', 'status', 'config'];

var registerTable = {};
var configTable = {};

// 微服务看门狗
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
}, WATCH_DOG_TIME);

// 注册服务
router.post('/register/:service_name', context=>{
	let service_name = context.params.service_name;
	let service_port = context.request.body.port;
	let isUpdateServiceConfig = !!registerTable[service_name];

	if(SERVICE_KEY_WORD.indexOf(service_name)>-1) {
		context.response.body = {
			code: -1,
			message: `微服务注册失败，服务名不得为 ${SERVICE_KEY_WORD.join(', ')}`
		};
		return;
	}

	registerTable[service_name] = {
		port: service_port,
		errorNum: 0
	};

	let configFilePath = `./config/${service_name}.json`;
	if(!fs.existsSync(configFilePath)) {
		logger.info(`${service_name} 服务配置文件未找到`);
		configTable[service_name] = {};
	}
	else {
		var configFileContent = fs.readFileSync(configFilePath, 'utf-8');
		try {
			configTable[service_name] = JSON.parse(configFileContent);
		}
		catch(error) {
			console.error(`${service_name} 服务配置文件解析失败`);
			configTable[service_name] = {};
		}
	}

	context.response.body = {
		code: 0,
		message: isUpdateServiceConfig?'微服务配置更新成功':'微服务配置已注册'
	};

	logger.info(`${service_name} 服务注册成功，端口${service_port}`);
})

// 配置服务
router.post('/config/:service_name', context=>{
	let service_name = context.params.service_name;
	let service_port = registerTable[service_name].port;
	configTable[service_name] = Object.assign({}, configTable[service_name], context.request.body);
	fetch(`http://localhost:${service_port}/${service_name}/config`, {
		method: 'POST',
		body: configTable[service_name]
	})
	.catch(error=>{
		console.error(`更新 ${service_name} 服务配置失败`);
	})
})

// 状态服务
router.get('/status', context=>{
	context.response.body = registerTable;
})

router.get('/status/:service_name', context=>{
	context.response.body = registerTable[service_name];
})

// 透明转发
router.all('*', async context=>{
	let service_name = context.request.path.split('/');
	if(service_name.length === 0) {
		context.response.body = {
			code: -1,
			message: '未提供服务名称'
		}
		return;
	}

	service_name = service_name[2];
	if(!registerTable[service_name]) {
		context.response.body = {
			code: -2,
			message: '所需要的微服务未注册'
		}
		logger.info(`请求 ${service_name} 服务失败`);
		return;
	}

	let service = registerTable[service_name];

	var ret;
	if(context.request.method === 'GET') {
		ret = await fetch(`http://localhost:${service.port}${context.request.path}`)
	}
	else {
		ret = await fetch(`http://localhost:${service.port}${context.request.path}`, {
			method: context.request.method,
			body: context.request.body
		})
	}
	
	context.response.body = ret;
})

app.use(logger()).use(bodyParser()).use(router.routes()).use(router.allowedMethods());
app.listen(3000);

