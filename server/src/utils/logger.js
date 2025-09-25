const config = require('../config');

class Logger {
  constructor() {
    this.level = config.logging.level;
    this.format = config.logging.format;
  }

  _formatMessage(level, message, meta = {}) {
    const timestamp = new Date().toISOString();
    
    if (this.format === 'json') {
      return JSON.stringify({
        timestamp,
        level: level.toUpperCase(),
        message,
        ...meta
      });
    }
    
    const metaStr = Object.keys(meta).length > 0 ? ` ${JSON.stringify(meta)}` : '';
    return `[${timestamp}] ${level.toUpperCase()}: ${message}${metaStr}`;
  }

  _shouldLog(level) {
    const levels = ['error', 'warn', 'info', 'debug'];
    const currentLevelIndex = levels.indexOf(this.level);
    const messageLevelIndex = levels.indexOf(level);
    return messageLevelIndex <= currentLevelIndex;
  }

  error(message, meta = {}) {
    if (this._shouldLog('error')) {
      console.error(this._formatMessage('error', message, meta));
    }
  }

  warn(message, meta = {}) {
    if (this._shouldLog('warn')) {
      console.warn(this._formatMessage('warn', message, meta));
    }
  }

  info(message, meta = {}) {
    if (this._shouldLog('info')) {
      console.log(this._formatMessage('info', message, meta));
    }
  }

  debug(message, meta = {}) {
    if (this._shouldLog('debug')) {
      console.log(this._formatMessage('debug', message, meta));
    }
  }
}

module.exports = new Logger();
