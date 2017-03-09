const fetch = require('./fetch');

function register(service_name, service_port) {
	return fetch(`http://localhost:3000/cloud/register/${service_name}`, {
		method: 'POST',
		body: {
			port: service_port
		}
	})
	.catch(err=>{
		console.log(err);
	})
}

module.exports = {
	register,
}