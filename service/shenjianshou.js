const crypto = require('crypto');

module.exports = class ShenJianShou {
	constructor() {
	  this.userKey = 'eaa04cd2f7-YmI5YTMyOT';
		this.userSecret = 'JlYWEwNGNkMmY3Yj-b583a002f3bb9a3';
	}

	getSign() {
		let _timestamp = parseInt(Date.now()/1000);
		return({
			user_key: this.userKey,
			timestamp: _timestamp,
			sign: crypto.createHash('md5').update(`${this.userKey}${_timestamp}${this.userSecret}`).digest('hex')
		});
	}
}