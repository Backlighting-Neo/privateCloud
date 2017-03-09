const fetch = require('node-fetch');

module.exports = async function(url, option = {}) {
	if(option.body && option.body.constructor != String) option.body = JSON.stringify(option.body);

	if(option.method === 'POST')
		option.headers = Object.assign({}, option.headers, {
			"content-type": 'application/json'
		});

	var result = await fetch(url, option);
	result = await result.text();
	
	try {
		result = JSON.parse(result);
	}
	catch(error) {}
	
	return result;
}