const http = require('http');
const Koa = require('koa');
const router = require('koa-router');
const logger = require('koa-logger');
const bodyParser = require('koa-bodyparser');
const fetch = require('./utils/fetch');

const CHECK_CLOUD_CENTER_DURATION = 10000;
const WATCH_DOG_TIME_LIMIT = 18000;
const CLOUD_CENTER_HOST = 'localhost:3000';

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

	  this._addDefaultRouter();

	  this._checkCloudCenterStatus = this._checkCloudCenterStatus.bind(this);
	}

	_addDefaultRouter() {
		this.router.get('/watchdog', context => {
			this.last_watchdog_timestamp = Date.now();
			context.response.body = {
				code: 0
			}
		});
	}

	_checkCloudCenterStatus() {
		if(Date.now() - this.last_watchdog_timestamp > WATCH_DOG_TIME_LIMIT) {
			console.log('云中心已断线 正在尝试重连');
			this._regsiter();
		}
	}

	_regsiter() {
		return fetch(`http://${CLOUD_CENTER_HOST}/cloud/register/${this.service_name}`, {
			method: 'POST',
			body: {
				port: this.port
			}
		})
		.catch(err=>{
			console.error(`${this.service_name} 服务注册失败`);
		})
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

		this.app.use(logger()).use(bodyParser()).use(this.router.routes()).use(this.router.allowedMethods());

		this.server = http.createServer(this.app.callback())
		.listen(0, 'localhost', ()=>{
			this.port = this.server.address().port;
			this._regsiter();
			setInterval(this._checkCloudCenterStatus, CHECK_CLOUD_CENTER_DURATION);
			console.log(`${this.service_name} 服务在 端口${this.port}上启动成功`);
		})
	}
}