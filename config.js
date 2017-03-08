var config = {
	wechat_notification: {
		port: 3000,
		subscriptionMap: {
			'tjyy8_newPerformance': [
				'逆光_1'
			]
		}
	},

	webhook: {
		port: 3001
	},

	shenjianshou: {
		userKey: 'eaa04cd2f7-YmI5YTMyOT',
		userSecret: 'JlYWEwNGNkMmY3Yj-b583a002f3bb9a3'
	}
};

module.exports = function(configItem) {
	return config[configItem];
}