// src/utils/logger.js

import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import { config } from '../config/env.js';

const customLevels = {
    levels: {
        fatal: 0,
        error: 1,
        warning: 2,
        info: 3,
        http: 4,
        debug: 5
    },
    colors: {
        fatal: 'magenta',
        error: 'red',
        warning: 'yellow',
        info: 'green',
        http: 'cyan',
        debug: 'blue'
    }
};

winston.addColors(customLevels.colors);

const isProduction = config.nodeEnv === 'production';

const consoleFormat = winston.format.combine(
    winston.format.colorize({ all: true }),
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.printf(({ timestamp, level, message }) => {
        return `${timestamp} [${level}]\t${message}`;
    })
);

const fileFormat = winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.printf(({ timestamp, level, message }) => {
        return `${timestamp} [${level}] ${message}`;
    })
);

const transports = [];

// Consola: SOLO en desarrollo (y test, para no perder feedback al debuggear tests).
// En producción, la salida por consola queda completamente desactivada.
if (!isProduction) {
    transports.push(
        new winston.transports.Console({
            level: 'debug',
            format: consoleFormat
        })
    );
}

// combined.log: TODA la actividad (info en adelante), con rotación diaria.
transports.push(
    new DailyRotateFile({
        level: 'info',
        dirname: 'logs',
        filename: 'combined-%DATE%.log',
        datePattern: 'YYYY-MM-DD',
        maxFiles: '14d',
        format: fileFormat
    })
);

// error.log: SOLO error y fatal, con rotación diaria.
transports.push(
    new DailyRotateFile({
        level: 'error',
        dirname: 'logs',
        filename: 'error-%DATE%.log',
        datePattern: 'YYYY-MM-DD',
        maxFiles: '14d',
        format: fileFormat
    })
);

const logger = winston.createLogger({
    levels: customLevels.levels,
    transports
});

export default logger;