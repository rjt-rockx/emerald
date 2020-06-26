const BaseService = require("../src/base/baseService.js");

module.exports = class CommandLogger extends BaseService {
	constructor(client) {
		super(client, {
			name: "Command Logger Service",
			description: "Logs command-related events.",
			enabled: true
		});
		this.loggedEvents = {
			commandPermissions: false,
			commandErrors: true,
			commandCancels: false,
			commandPrefixChanges: false,
			commandStatusChanges: true,
			commandRuns: true,
			guildOnly: false,
			nsfw: false,
			userPermissions: false,
			clientPermissions: false
		};
	}

	onCommandBlock(ctx) {
		if (["globalCommandPermissions", "guildCommandPermissions"].includes(ctx.blockReason) && this.loggedEvents.commandPermissions) {
			const { blockData: commandPermissions } = ctx;
			const missingPermission = commandPermissions.global.blockReason || commandPermissions.guild.blockReason;
			if (!missingPermission) return;
			return this.logMissingPermission(ctx, missingPermission);
		}
	}

	onCommandStatusChange(ctx) {
		if (!this.loggedEvents.commandStatusChanges) return;
		const { cyan, yellow, gray } = ctx.logger.chalk;
		ctx.logger.warn(`Command ${cyan(ctx.command.name)} was ${yellow(ctx.enabled ? "enabled" : "disabled")} in the server ${ctx.guild.name} ${gray(`(${ctx.guild.id})`)}`);
	}

	onCommandPrefixChange(ctx) {
		if (!this.loggedEvents.commandPrefixChanges) return;
		const { green, gray } = ctx.logger.chalk;
		ctx.logger.info(`Command prefix set to ${green(ctx.prefix)} for the server ${ctx.guild.name} ${gray(`(${ctx.guild.id})`)}`);
	}

	onCommandRun(ctx) {
		if (!this.loggedEvents.commandRuns) return;
		const { cyan, green, gray } = ctx.logger.chalk;
		ctx.logger.info(`Command ${cyan(ctx.command.name)} was ${green("executed")} by user ${ctx.user.tag} ${gray(`(${ctx.user.id})`)}`);
	}

	onCommandError(ctx) {
		if (!this.loggedEvents.commandErrors) return;
		const { cyan, yellow, gray } = ctx.logger.chalk;
		ctx.logger.error(`Command ${cyan(ctx.command.name)} ${yellow("did not execute")} for user ${ctx.user.tag} ${gray(`(${ctx.user.id})`)}`);
		ctx.logger.error(`${ctx.error.stack}`);
	}

	logMissingPermission(ctx, missingPermission) {
		const { cyan, red, gray } = ctx.logger.chalk;
		const reasons = {
			"global": () => " as this command is disabled globally.",
			"guild": id => ` in the ${cyan(ctx.client.guilds.cache.get(id).name)} server.`,
			"category-channel": id => ` in the ${cyan(ctx.guild.channels.cache.get(id).name)} category in the ${cyan(ctx.guild.name)} server.`,
			"text-channel": id => ` in the #${cyan(ctx.guild.channels.cache.get(id).name)} channel in the ${cyan(ctx.guild.name)} server.`,
			"voice-channel": id => ` in the ${cyan(ctx.guild.channels.cache.get(id).name)} voice channel in the ${cyan(ctx.guild.name)} server.`,
			"role": id => ` with the ${cyan(ctx.guild.roles.cache.get(id).name)} role in the ${cyan(ctx.guild.name)} server.`,
			"user": () => "."
		};
		ctx.logger.warn(`Command ${cyan(ctx.command.name)} was ${red("not executed")} for user ${ctx.user.tag} ${gray(`(${ctx.user.id})`)}${reasons[missingPermission.type](missingPermission.id)}`);
	}
};