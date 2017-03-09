function getSpiderTjyy8TemplateMessage(url, data) {
	var desc = data.performance_desc;
	if(data.performance_desc.length > 100) desc = desc.substr(0, 100) + '...';

	return (
`【文惠卡】 新演出通知

[标题] ${data.performance_title}
[剧团] ${data.performance_troupe}
[时长] ${data.performance_duration}
[票价] ${data.performance_price_summary}
[剧院] ${data.performace_theatre}
[时间] ${data.performance_time.join('\n           ')}

${url}

${desc}`);
}

module.exports = {
	getTemplateMessage: getSpiderTjyy8TemplateMessage
}