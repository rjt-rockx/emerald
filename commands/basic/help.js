const BaseCommand = require("../../src/base/baseCommand.js");
const Paginator = require("../../src/paginator.js");
const { Util: { escapeMarkdown } } = require("discord.js");
const toTitleCase = str => str.replace(/\w\S*/g, txt => txt.charAt(0).toUpperCase() + txt.substr(1));

module.exports = class Help extends BaseCommand {
	constructor(client) {
		super(client, {
			name: "help",
			group: "basic",
			description: "Get help for a specific command or for all commands.",
			clientPermissions: ["SEND_MESSAGES", "EMBED_LINKS"],
			userPermissions: ["ADMINISTRATOR"],
			guarded: true,
			args: [
				{
					key: "command",
					prompt: "Command to get help for.",
					type: "command",
					default: "all"
				}
			]
		});
	}

	async task(ctx) {
		const prefix = ctx.guildStorage.has("commandPrefix") ? ctx.guildStorage.get("commandPrefix") : ctx.client.commandPrefix;
		if (ctx.args.command === "all") {
			const commands = this.client.registry.commands.array().sort((a, b) => a.name.localeCompare(b.name)).map(command => {
				const commandData = this.getCommandData(command, prefix);
				return { name: commandData.name, value: commandData.description };
			});
			new Paginator(ctx.channel, ctx.author, commands, 15, {
				embedTemplate: { title: "List of commands:" }
			});
			return;
		}
		const commandData = this.getCommandData(ctx.args.command, prefix);
		const fields = [];
		if (commandData.aliases)
			fields.push({ name: "Aliases", value: commandData.aliases });
		if (commandData.commandArgs)
			fields.push({ name: "Arguments", value: commandData.commandArgs });
		if (commandData.userperms)
			fields.push({ name: "Required User Permissions", value: commandData.userperms });
		if (commandData.clientperms)
			fields.push({ name: "Required Bot Permissions", value: commandData.clientperms });
		ctx.send({ embed: { title: commandData.name, description: commandData.description, fields } });
	}

	getCommandData(command, prefixToUse) {
		let commandTitle = escapeMarkdown(prefixToUse + command.name), commandArgs = "";
		if (command.argsCollector && command.argsCollector.args && Array.isArray(command.argsCollector.args)) {
			const argKeys = command.argsCollector.args.map(arg => {
				const argName = (arg.oneOf && arg.oneOf.length < 4) ? arg.oneOf.join("/") : arg.key;
				return `${typeof arg.default !== "undefined" && arg.default !== null ? `[${argName}]` : `<${argName}>`}`;
			});
			commandTitle += ` ${argKeys.join(" ")}`;
			if (command.argsCollector.args.length > 0)
				commandArgs = command.argsCollector.args.map(arg => `**${toTitleCase(arg.key)}** - ${arg.prompt} ${typeof arg.default !== "undefined" && arg.default !== null ? `(Default: ${typeof arg.default === "string" && arg.default.length ? arg.default : "nothing"})` : ""}`).join("\n");
		}
		let userperms = "";
		if (Array.isArray(command.userPermissions) && command.userPermissions.length > 0)
			userperms = command.userPermissions.map(permission => toTitleCase(permission.split("_").join(" ").toLowerCase())).join(", ");
		let clientperms = "";
		if (Array.isArray(command.clientPermissions) && command.clientPermissions.length > 0)
			clientperms = command.clientPermissions.map(permission => toTitleCase(permission.split("_").join(" ").toLowerCase())).join(", ");
		return {
			name: commandTitle,
			aliases: Array.isArray(command.aliases) ? command.aliases.map(alias => escapeMarkdown(prefixToUse + alias)).join(", ") : "",
			description: command.description,
			commandArgs, userperms, clientperms
		};
	}
};