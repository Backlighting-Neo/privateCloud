const winston = require('winston');
const ExtraConsole = require('winston-extra');
const DailyRotateFile = require('winston-daily-rotate-file');
const fs = require('fs-extra');
const path = require('path');
const utils = require('util');

function getFormatTime() {
    let time = new Date();
    return `${time.getFullYear()}-${time.getMonth()+1}-${time.getDate()} ${time.getHours()}:${time.getMinutes()}:${time.getSeconds()}.${time.getMilliseconds()}`;
}

function showLineInfo(colorize) {
    let stack = (new Error()).stack.split('\n').slice(3);
    let s = stack[6],
        sp = /at\s+(.*)\s+\((.*):(\d*):(\d*)\)/gi.exec(s) || /at\s+()(.*):(\d*):(\d*)/gi.exec(s);
    let data = {};
    if (sp.length === 5) {
        data.method = sp[1];
        data.path = sp[2];
        data.line = sp[3];
        data.pos = sp[4];
        data.file = path.basename(data.path);
        data.msg = (' at ' + data.path.replace(process.__basePath + '/', '') + ((':' + data.line) || '') + ((':' + data.pos) || '') + ' ' + (data.method || ''));
        if (colorize) {
            data.msg = data.msg.grey;
        }
    }
    return data;
}
let DailyErrorFile = module.exports = function(options) {
    this.name = 'DailyErrorFile';
    DailyRotateFile.apply(this, arguments);
}
utils.inherits(DailyErrorFile, DailyRotateFile);

DailyErrorFile.prototype.log = function(level, msg, meta, callback) {
    let data = showLineInfo();
    DailyRotateFile.prototype.log.call(this, level, msg, meta, callback);
};

//silly, debug, verbose, info, warn, error
let logger = function(options) {
    options = options || {};
    options.datePattern = options.datePattern || '/yyyy-MM-dd.log'; //文件名
    options.filename = options.filename || path.resolve('../logs'); //写文件的路径
    options.prefix = options.prefix; //前缀
    options.level = options.level || 'info'; //普通打印日志输出级别
    options.fileLevel = options.fileLevel || 'error'; //日志文件输出的级别
    options.filePrettyPrint = options.filePrettyPrint || false; //日志文件是否 json序列化
    options.wrireFileDirName = options.wrireFileDirName || path.resolve('../file_logs'); //调用 logger.file 写文件的目录
    fs.ensureDirSync(options.filename);
    fs.ensureDirSync(options.wrireFileDirName);
    let log = new(winston.Logger)({
        transports: [
            new(ExtraConsole)({
                timestamp: function() {
                    return getFormatTime().grey;
                },
                level: options.level,
                colorize: true,
                label: options.prefix && options.prefix.magenta,
                prettyPrint: true,
                handleExceptions: true
            }),
            new(DailyErrorFile)({
                timestamp: function() {
                    return getFormatTime();
                },
                level: options.fileLevel,
                json: false,
                prettyPrint: options.filePrettyPrint,
                datePattern: options.datePattern,
                maxFiles: 15,
                filename: options.filename
            }),
        ]
    });
    log.timeLevel = options.timeLevel;

    return log;
}
module.exports = logger;