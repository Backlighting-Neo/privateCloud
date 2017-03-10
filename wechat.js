const MicroService = require('./createService');

const wechat = require('wechat4u');

var service = new MicroService('wechat');
var router = service.router;

var wechatBot = new wechat();
wechatBot.start();

var loginUUID = '';
var contactsMap = {};

wechatBot.on('uuid', uuid => {  // 记录UUID
	loginUUID = uuid;
});
wechatBot.on('login', () => {  // 确认登录
	loginUUID = '';
})
wechatBot.on('contacts-updated', () => {  // 更新通讯录
	contactsMap = {};
	wechatBot.friendList.forEach(friend => {
		if(contactsMap[friend.nickname]) {
			console.error(`发现重名用户 ${friend.nickname}`);
			return;
		}
		contactsMap[friend.nickname] = friend.username;
	})
})

router.get('/login', async context => {
	if(!loginUUID)
		context.response.body = {
			"code": -1
		}
	else
		context.response.body = {
			"code": 0,
			"qrcode_url": 'https://login.weixin.qq.com/qrcode/' + loginUUID
		}
});

router.post('/send', async context => {
	let msgType = context.request.body.type;
	let msgText = context.request.body.message;
	console.log(context.request.body);

	if(!msgType || !service.config.subscriptionMap[msgType]) {
		context.response.body = {
			"code": -10,
			"message": "invalid message type"
		};
		return;
	}
	let subscriptionUserList = service.config.subscriptionMap[msgType];
	console.log(service.config.subscriptionMap);

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