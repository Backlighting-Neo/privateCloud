const Koa = require('koa');
const app = new Koa();
const router = require('koa-router')();
const logger = require('koa-logger');
const bodyParser = require('koa-bodyparser');
const fetch = require('node-fetch');

const config = require('./config.js')('webhook');

function getSpiderTjyy8TemplateMessage(url, data) {
	var desc = data.performance_desc;
	if(data.performance_desc.length > 100) desc = desc.substr(0, 100) + '...';

	return (
`【文惠卡】 新演出通知

[标题] ${data.performance_title}
[剧团] ${data.performance_troupe}
[时长] ${data.performance_duration}
[票价] ${data.performance_price_summary}
[剧院] ${data.performace_theatre}
[时间] ${data.performance_time.join('\n           ')}

${url}

${desc}`);
}

router.post('/webhook/spider/tjyy8', async function(context) {
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
			message: getSpiderTjyy8TemplateMessage(url, data)
		})
	});
	console.log(await res.json());

	context.response.body = data_key;
})

app.use(logger()).use(bodyParser()).use(router.routes()).use(router.allowedMethods());
app.listen(config.port);
console.log('webhook service has been listened at port '+config.port);
