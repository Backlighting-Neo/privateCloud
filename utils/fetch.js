const fetch = require('node-fetch');

module.exports = function(url, option = {}) {
	if(option.body && option.body.constructor != String) option.body = JSON.stringify(option.body);
	option.headers = Object.assign({}, option.headers, {
		"content-type": 'application/json'
	});
	return fetch(url, option)
	.then(res => res.json())
}