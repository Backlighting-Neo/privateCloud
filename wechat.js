const MicroService = require('./utils/createService');

const wechat = require('wechat4u');

var service = new MicroService('wechat');
var router = service.router;

var wechatBot = new wechat();
wechatBot.start();

service.status = {
	loginUUID: '',
	loginUsername: '',
	wechatStatus: 'offline',
	contactsMap: {}
};

wechatBot.on('uuid', uuid => {  // 记录UUID
	// qrcode.generate('https://login.weixin.qq.com/l/' + uuid, {small: true});
	service.status.loginUUID = uuid;
});
wechatBot.on('login', () => {  // 确认登录
	service.status.loginUUID = '';
	service.status.loginUsername = '';
	service.status.wechatStatus = 'online';
})
wechatBot.on('contacts-updated', () => {  // 更新通讯录
	service.status.contactsMap = {};
	wechatBot.friendList.forEach(friend => {
		if(service.status.contactsMap[friend.nickname]) {
			console.error(`发现重名用户 ${friend.nickname}`);
			return;
		}
		service.status.contactsMap[friend.nickname] = friend.username;
	})
})

router.get('/login', context => {
	if(!service.status.loginUUID)
		context.response.body = {
			"code": -1
		}
	else
		context.response.body = {
			"code": 0,
			"qrcode_url": 'https://login.weixin.qq.com/l/' + service.status.loginUUID
		}
});

router.post('/send', async context => {
	let msgType = context.request.body.type;
	let msgText = context.request.body.message;

	if(!msgType || !service.config.subscriptionMap[msgType]) {
		context.response.body = {
			"code": -10,
			"message": "invalid message type"
		};
		return;
	}

	let subscriptionUserList = service.config.subscriptionMap[msgType];
	console.log(`收到[${msgType}]类型消息，推送给${subscriptionUserList.length}位联系人`);
	try {
		await Promise.all(subscriptionUserList.map(nickname=>{
			let username = contactsMap[nickname];
			return wechatBot.sendMsg(msgText, username);
		}));

		context.response.body = {
			"code": 0
		};
	}
	catch(err) {
		context.response.body = {
			code: -20,
			message: err.message
		}
		console.error(`消息推送失败`);
		console.error(err);
	}
})

service.start();