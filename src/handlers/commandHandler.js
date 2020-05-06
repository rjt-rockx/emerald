const BaseCommand = require("../base/baseCommand.js");

// this is code from my older bot, useful stuff
const { lstatSync, readdirSync } = require("fs");
const { resolve, join, parse } = require("path").win32;

const isDirectory = source => lstatSync(source).isDirectory() && !source.startsWith(".");
const getDirectories = source => readdirSync(source).map(name => join(source, name)).filter(isDirectory).map(directory => parse(directory).name);

class CommandHandler {
	async initialize(client) {
		this.client = client;
		this.registerTypes();
		this.addCommandsIn("../../commands");
		return [...this.client.registry.commands.values()]; // we convert the discord.js collection into an array for consistency with the service handler
	}

	registerTypes() {
		this.client.registry.registerDefaultTypes();
	}

	checkIfValid(command) {
		return ["function", "object"].includes(typeof command) && command.prototype && command.prototype instanceof BaseCommand;
	}

	addCommand(pathToCommand) {
		if (pathToCommand.endsWith(".js") && !pathToCommand.endsWith("index.js")) { // index.js is usually used as an index of all other js files in that dir
			const command = require(pathToCommand);
			if (this.checkIfValid(command)) {
				const groupID = resolve(pathToCommand).substring(0, pathToCommand.indexOf(".")).split("\\").reverse()[1]; // we won't actually need the filename tbh
				if (!this.client.registry.groups.has(groupID))
					this.client.registry.registerGroup(groupID);
				this.client.registry.registerCommand(command);
			}
		}
	}

	addCommandsIn(commandsFolder) { // helper method to do it for multiple commands at once
		// lets say all groups are individual folders in a commands folder, and the actual command files are in each group folder
		// so we call this method with the commands folder and it goes through the files, checking and adding each once
		const absoluteCommandsFolderPath = resolve(__dirname, commandsFolder);
		for (const group of getDirectories(absoluteCommandsFolderPath)) {
			for (const file of readdirSync(join(absoluteCommandsFolderPath, group)))
				this.addCommand(join(absoluteCommandsFolderPath, group, file));
		}
	}
}

module.exports = new CommandHandler();