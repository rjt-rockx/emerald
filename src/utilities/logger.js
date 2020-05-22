const { stdout, stderr } = process;
const logConsole = new require("console").Console({
	stdout, stderr, colorMode: false
});
const chalk = require("chalk");

class Logger {

	get chalk() {
		return chalk;
	}

	log(...args) {
		stdout.write(`[${new Date().toTimeString().split(" ")[0]}] `);
		logConsole.log(...args);
	}

	info(...args) {
		stdout.write(chalk.blue(`[${new Date().toTimeString().split(" ")[0]}] `));
		logConsole.info(...args);
	}

	warn(...args) {
		stdout.write(chalk.yellow(`[${new Date().toTimeString().split(" ")[0]}] `));
		logConsole.warn(...args);
	}

	error(...args) {
		stdout.write(chalk.red(`[${new Date().toTimeString().split(" ")[0]}] `));
		logConsole.error(...args);
	}
}

module.exports = new Logger();