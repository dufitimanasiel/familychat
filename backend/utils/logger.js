const fs = require('fs');
const path = require('path');

class Logger {
  constructor() {
    this.logDir = path.join(__dirname, '../../logs');
    this.ensureLogDirectory();
  }

  ensureLogDirectory() {
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }
  }

  formatMessage(level, component, message, context = {}) {
    const timestamp = new Date().toISOString();
    return `[${timestamp}] [${level}] [${component}] ${message} ${Object.keys(context).length ? JSON.stringify(context) : ''}`;
  }

  log(level, component, message, context = {}) {
    const formattedMessage = this.formatMessage(level, component, message, context);
    
    // Console output
    console.log(formattedMessage);
    
    // File output
    const logFile = path.join(this.logDir, `${level.toLowerCase()}.log`);
    fs.appendFileSync(logFile, formattedMessage + '\n');
  }

  debug(component, message, context = {}) {
    this.log('DEBUG', component, message, context);
  }

  info(component, message, context = {}) {
    this.log('INFO', component, message, context);
  }

  warn(component, message, context = {}) {
    this.log('WARNING', component, message, context);
  }

  error(component, message, context = {}) {
    this.log('ERROR', component, message, context);
  }

  critical(component, message, context = {}) {
    this.log('CRITICAL', component, message, context);
  }
}

module.exports = new Logger();
