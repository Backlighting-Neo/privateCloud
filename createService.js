const http = require('http');
const Koa = require('koa');
const router = require('koa-router');
const koa_logger = require('koa-logger');
const bodyParser = require('koa-bodyparser');
const fetch = require('./utils/fetch');
const fs = require('fs');
const winston_logger = require('./utils/log.js');
const path = require('path');

const CHECK_CLOUD_CENTER_DURATION = 10000;
const WATCH_DOG_TIME_LIMIT = 18000;
const CLOUD_CENTER_HOST = 'localhost:3000';

var logger = winston_logger({
	level: 'info',
	fileLevel: 'info',
	filename: path.resolve('../', 'logs', 'private_cloud'),
	wrireFileDirName: path.resolve('../', 'logs', 'private_cloud_file_log'), //写文件的logs
})

module.exports = class MicroService {
	constructor(service_name) {
		this.app = new Koa();
		this.router = router({
			prefix: `/${service_name}`
		});
		this.port = 0;
		this.service_name = service_name;
		this.last_watchdog_timestamp = Date.now();
		this.server = null;
		this.config = null;
		this.status = {};
		this.getStatus = null;
		this.logger = logger;
		
		this._getDefaultConfig();
		this._addDefaultRouter();
		
		this._checkCloudCenterStatus = this._checkCloudCenterStatus.bind(this);
	}
	
	_updateConfig(config) {
		this.config = config;
	}
	
	_getDefaultConfig() {
		let configFilePath = `./config/${this.service_name}.json`;
		if (!fs.existsSync(configFilePath)) {
			this.logger.info(`${this.service_name} 服务配置文件未找到`);
			this.config = {};
		} else {
			var configFileContent = fs.readFileSync(configFilePath, 'utf-8');
			try {
				this.config = JSON.parse(configFileContent);
			} catch (error) {
				logger.error(`${this.service_name} 服务配置文件解析失败`);
				this.config = {};
			}
		}
	}
	
	_addDefaultRouter() {
		this.router.get('/watchdog', context => { // 看门狗
			this.last_watchdog_timestamp = Date.now();
			context.response.body = {
				code: 0
			}
		});
		
		this.router.get('/config', context => { // 获取当前配置
			context.response.body = {
				code: 0,
				data: this.config
			};
		})
		
		this.router.post('/config', context => { // 配置服务
			this._updateConfig(context.request.body);
			context.response.body = {
				code: 0
			};
		});
		
		this.router.get('/status', context => { // 状态服务
			context.response.body = {
				code: 0,
				data: this.getStatus ? this.getStatus() : this.status
			}
		})
	}
	
	_checkCloudCenterStatus() {
		if (Date.now() - this.last_watchdog_timestamp > WATCH_DOG_TIME_LIMIT) {
			this.logger.info('云中心已断线 正在尝试重连');
			this._register();
		}
	}
	
	_register() {
		return fetch(`http://${CLOUD_CENTER_HOST}/cloud/register/${this.service_name}`, {
			method: 'POST',
			body: {
				port: this.port
			}
		})
		.catch(err => {
			logger.error(`${this.service_name} 服务注册失败`);
		})
	}
	
	setStatus(newStatus) {
		this.status = Object.assign({}, this.status, newStatus);
	}
	
	fetchService(url, option) {
		return fetch(`http://${CLOUD_CENTER_HOST}/cloud${url}`, option);
	}
	
	start() {
		this.router.all('*', context => {
			context.response.body = {
				code: 404
			}
		});
		
		this.app.use(koa_logger()).use(bodyParser()).use(this.router.routes()).use(this.router.allowedMethods());
		
		this.server = http.createServer(this.app.callback())
		.listen(0, 'localhost', () => {
			this.port = this.server.address().port;
			this._register();
			setInterval(this._checkCloudCenterStatus, CHECK_CLOUD_CENTER_DURATION);
			logger.info(`${this.service_name} 服务在 端口${this.port}上启动成功`);
		})
	}
}