const fetch = require('../utils/fetch');
const shenjianshouService = require('../service/shenjianshou');
const shenjianshou = new shenjianshouService();

module.exports = {
	default_schedule: '',

	execute() {
		let params = Object.assign({}, shenjianshou.getSign(), {
			crawler_id: 30241
		});
		params = Object.keys(params).map(key=>`${key}=${params[key]}`).join('&');
		return fetch('http://www.shenjianshou.cn/rest/crawler/start?'+params)
	};
}