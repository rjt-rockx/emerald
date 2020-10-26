const BaseCommand = require("../../src/base/baseCommand.js");
const { Util: { escapeMarkdown } } = require("discord.js");
const { toTitleCase, chunk } = require("../../src/utilities/utilities.js");

module.exports = class Help extends BaseCommand {
	constructor(client) {
		super(client, {
			name: "help",
			group: "bot",
			description: "Get help for a specific command or for all commands.",
			clientPermissions: ["SEND_MESSAGES", "EMBED_LINKS"],
			aliases: ["h"],
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
			const allGroups = ctx.client.registry.groups.sort((a, b) => a.name.localeCompare(b.name));
			const groupIDs = allGroups.array().map(group => group.id);
			const allCommandPages = allGroups.map(group => this.getCommandPages(group, prefix, 4)).flat();
			const allCommandFields = allCommandPages.map(page => page.fields);
			return ctx.paginate(allCommandFields, {
				embedTemplate: ({ current, total }) => {
					return {
						title: `${toTitleCase(allCommandPages[current - 1].group.name)} commands`,
						description: `Type \`${prefix}help\` followed by the command name to see detailed help for that command.`,
						footer: {
							text: [
								`Group ${groupIDs.findIndex(id => id === allCommandPages[current - 1].group.id) + 1} of ${groupIDs.length}`,
								`Page ${current} of ${total}`
							].join(" · ")
						},
						thumbnail: { url: ctx.client.user.displayAvatarURL({ format: "png", dynamic: true, size: 1024 }) }
					};
				},
				preChunked: true
			});
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
				const argName = (arg.oneOf && arg.oneOf.length < 3) ? arg.oneOf.join("/") : arg.key;
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

	getCommandPages(group, prefix, commandsPerPage) {
		const commandFields = group.commands.array()
			.sort((a, b) => a.name.localeCompare(b.name))
			.map(command => {
				const commandData = this.getCommandData(command, prefix);
				return { name: commandData.name, value: commandData.description };
			});
		return chunk(commandFields, commandsPerPage)
			.map(fields => ({ group, fields }));
	}
};