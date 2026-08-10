// src/utils/logger.js

import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';

/**
 * Niveles personalizados de ShipNow API.
 *
 * Nota técnica: en Winston, el NÚMERO MÁS BAJO = MAYOR SEVERIDAD/PRIORIDAD.
 * Por eso "fatal" (el más grave) tiene el número más chico y "debug"
 * (el más detallado, menos grave) el número más alto. Esto es lo que
 * permite que, al configurar level: 'info', se muestren info/warning/
 * error/fatal pero NO debug ni http.
 */
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

const isProduction = process.env.NODE_ENV === 'production';

// ---------- Formato para consola (con colores) ----------
const consoleFormat = winston.format.combine(
    winston.format.colorize({ all: true }),
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.printf(({ timestamp, level, message }) => {
        return `${timestamp} [${level}]\t${message}`;
    })
);

// ---------- Formato para archivo (sin colores, más parseable) ----------
const fileFormat = winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.printf(({ timestamp, level, message }) => {
        return `${timestamp} [${level}] ${message}`;
    })
);

// ---------- Transporte de consola ----------
// Desarrollo: muestra TODO (incluye debug).
// Producción: muestra desde info en adelante (info, warning, error, fatal).
const consoleTransport = new winston.transports.Console({
    level: isProduction ? 'info' : 'debug',
    format: consoleFormat
});

// ---------- Transporte de archivo con rotación diaria ----------
// Solo persiste error y fatal (level: 'error' incluye todo lo que tenga
// número <= 1, es decir: fatal(0) y error(1)).
const fileRotateTransport = new DailyRotateFile({
    level: 'error',
    dirname: 'logs',
    filename: 'errors-%DATE%.log',
    datePattern: 'YYYY-MM-DD',
    maxFiles: '14d',
    format: fileFormat
});

const logger = winston.createLogger({
    levels: customLevels.levels,
    transports: [
        consoleTransport,
        fileRotateTransport
    ]
});

export default logger;