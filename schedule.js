const schedule = require('node-schedule');
const fs = require('fs');
const MicroService = require('./utils/createService');

var service = new MicroService('schedule');
var router = service.router;

service.status = {
	schedule: {}
};

service.getStatus = function() {
	return {
		schedule: Object.keys(service.status.schedule).map(task=>({
			name: task,
			cron: service.status.schedule[task].cron,
			last_execute_timestamp: service.status.schedule[task].last_execute_timestamp,
			last_execute_status: service.status.schedule[task].last_execute_status
		}))
	}
}

function addTask(name, cron, execute) {
	service.logger.info(`注册新任务[${name}] 执行cron[${cron}]`);
	if(service.status.schedule[name]) {  // 如果要求新建的任务存在
		service.status.schedule[name].task.cancel();
		delete service.status.schedule[name];
	}
	service.status.schedule[name] = {
		cron,
		last_execute_timestamp: Date.now(),
		last_execute_result: '',
		last_execute_status: '',
		task: schedule.scheduleJob(cron, function(name) {
			execute.apply(service)
			.then(res=>{
				service.status.schedule[name].last_execute_status = 'OK';
				service.status.schedule[name].last_execute_result = res;
			})
			.catch(err=>{
				service.status.schedule[name].last_execute_status = 'Error';
				service.status.schedule[name].last_execute_result = err;
			})
		}.bind(null, name))
	}
}

function removeTask(name) {
	if(service.status.schedule[name]) {  // 如果要求新建的任务存在
		service.status.schedule[name].task.cancel();
		delete service.status.schedule[name];
	}
}

service.config.list.forEach(task_name => {  // 添加默认定时任务
	if(!fs.existsSync(`./task/${task_name}.js`)) {
		service.logger.error(`${task_name} 任务未找到`);
		return;
	}
	let task = require(`./task/${task_name}.js`);
	if(!task.default_schedule || !task.execute) {
		service.logger.error(`${task_name} 任务配置错误`);
		return;
	}
	addTask(task_name, task.default_schedule, task.execute);
})

service.start();