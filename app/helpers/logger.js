const winston = require('winston'),
    rotate = require('winston-daily-rotate-file'),
    path = require('path');

let logger = new winston.Logger({
    level: 'info',
    transports: [
        new(winston.transports.Console)({
            colorize: true,
        }),
        new winston.transports.DailyRotateFile({
            filename: 'app',
            dirname: path.join(__dirname, '../../logs'),
            maxsize: 20971520, //20MB
            maxFiles: 25,
            datePattern: '.dd-MM-yyyy.log'
        })
    ]
});

module.exports = logger;