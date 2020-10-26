const BaseCommand = require("../base/baseCommand.js");

const { readdirSync } = require("fs");
const { resolve, join, sep } = require("path");
const { getDirectories } = require("../utilities/utilities.js");

class CommandHandler {
	async initialize(client) {
		this.client = client;
		if (!this.client.commandHandler)
			this.client.commandHandler = this;
		this.registerTypes();
		this.addCommandsIn("../../commands");
		return [...this.client.registry.commands.values()];
	}

	registerTypes() {
		this.client.registry.registerDefaultTypes();
		this.client.registry.registerTypesIn(resolve(__dirname, "../types/"));
	}

	checkIfValid(command) {
		return ["function", "object"].includes(typeof command) && command.prototype && command.prototype instanceof BaseCommand;
	}

	addCommand(pathToCommand) {
		if (pathToCommand.endsWith(".js") && !pathToCommand.endsWith("index.js")) { // index.js is usually used as an index of all other js files in that dir
			const command = require(pathToCommand);
			if (this.checkIfValid(command)) {
				const groupName = resolve(pathToCommand).substring(0, pathToCommand.indexOf(".")).split(sep).reverse()[1]; // we won't actually need the filename tbh
				if (!this.client.registry.groups.has(groupName.toLowerCase()))
					this.client.registry.registerGroup(groupName.toLowerCase(), groupName);
				this.client.registry.registerCommand(command);
			}
		}
	}

	addCommandsIn(commandsFolder) {
		const absoluteCommandsFolderPath = resolve(__dirname, commandsFolder);
		for (const group of getDirectories(absoluteCommandsFolderPath)) {
			for (const file of readdirSync(join(absoluteCommandsFolderPath, group)))
				this.addCommand(join(absoluteCommandsFolderPath, group, file));
		}
	}
}

module.exports = new CommandHandler();