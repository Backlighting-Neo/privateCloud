const Koa = require('koa');
const app = new Koa();
const router = require('koa-router')();
const logger = require('koa-logger');
const bodyParser = require('koa-bodyparser');
const fetch = require('node-fetch');
const wechat = require('wechat4u');
const qrcode = require('qrcode-terminal');

const config = require('./config.js')('wechat_notification');

var globalData = {
	loginUuid: '',  // 登录UUID
	contactsMap: {}
};

var wechatBot = new wechat();
wechatBot.start();

wechatBot.on('uuid', uuid => {  // 记录UUID
	qrcode.generate('https://login.weixin.qq.com/l/' + uuid, {small: true});
	globalData.loginUuid = uuid;
});
wechatBot.on('login', () => {  // 确认登录
	globalData.loginUuid = '';
})
wechatBot.on('contacts-updated', () => {  // 更新通讯录
	globalData.contactsMap = {};
	wechatBot.friendList.forEach(friend => {
		if(globalData.contactsMap[friend.nickname]) {
			console.error(`发现重名用户 ${friend.nickname}`);
			return;
		}
		globalData.contactsMap[friend.nickname] = friend.username;
	})
})

router.get('/wechat/login', async function(context) {
	if(!globalData.loginUuid)
		context.response.body = {
			"code": -1
		}
	else
		context.response.body = {
			"code": 0,
			"qrcode_url": 'https://login.weixin.qq.com/qrcode/' + globalData.loginUuid
		}
});

router.post('/wechat/send', async function(context) {
	let msgType = context.request.body.type;
	let msgText = context.request.body.message;
	console.log(context.request.body);

	if(!msgType || !config.subscriptionMap[msgType]) {
		context.response.body = {
			"code": -10,
			"message": "invalid message type"
		};
		return;
	}
	let subscriptionUserList = config.subscriptionMap[msgType];
	console.log(config.subscriptionMap);

	try {
		await Promise.all(subscriptionUserList.map(nickname=>{
			let username = globalData.contactsMap[nickname];
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

app.use(logger()).use(bodyParser()).use(router.routes()).use(router.allowedMethods());
app.listen(config.port);
console.log('wechat service has been listened at port '+config.port);
