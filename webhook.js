const MicroService = require('./createService');

const tjyy8Service = require('./service/tjyy8');

var service = new MicroService('webhook');
var router = service.router;

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

	var res = await service.fetchService('/wechat/send', {
		method: 'POST',
		body: {
			type: 'tjyy8_newPerformance',
			message: tjyy8Service.getTemplateMessage(url, data)
		}
	});
	console.log(`收到神箭手tjyy8爬虫推送，Url:${url}`);

	context.response.body = data_key;
});

service.start();