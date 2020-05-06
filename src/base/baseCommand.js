const { Command } = require("discord.js-commando");

module.exports = class BaseCommand extends Command {
	constructor(client, commandInfo) {
		super(client, {
			...commandInfo,
			memberName: commandInfo.memberName || commandInfo.name
		});
	}

	checkGuildCommandPermissions(ctx) {
		let commandPermissions = [];
		if (ctx.guildStorage.has("commandPermissions"))
			commandPermissions = ctx.guildStorage.get("commandPermissions");
		else ctx.guildStorage.set("commandPermissions", []);
		return this.checkCommandPermissions(ctx, commandPermissions);
	}

	checkGlobalCommandPermissions(ctx) {
		let commandPermissions = [];
		if (ctx.globalStorage.has("commandPermissions"))
			commandPermissions = ctx.globalStorage.get("commandPermissions");
		else ctx.globalStorage.set("commandPermissions", []);
		return this.checkCommandPermissions(ctx, commandPermissions);
	}

	checkCommandPermissions(ctx, commandPermissions) {
		let permitted = true, blockReason = {};
		const currentCommand = commandPermissions.find(permission => permission.command && permission.command === this.name);
		if (!currentCommand || this.guarded) return { permitted };
		for (const { type, id, enabled } of currentCommand.permissions) {
			if (this.matchesConditions(ctx, type, id)) {
				if (!enabled) blockReason = { type, id };
				permitted = enabled;
			}
		}
		return { permitted, blockReason };
	}

	matchesConditions(ctx, type, id) {
		if (type === "global") return true;
		if (type === "guild" && ctx.guild.id === id) return true;
		if (type === "category-channel" && ctx.channel.parentID && ctx.channel.parentID === id) return true;
		if (type === "text-channel" && ctx.channel.id === id) return true;
		if (type === "voice-channel" && ctx.member.voice.channelID && ctx.member.voice.channelID === id) return true;
		if (type === "role" && ctx.member.roles.cache.has(id)) return true;
		if (type === "user" && ctx.user.id === id) return true;
		return false;
	}

	beforeExecute(ctx) {
		// default method that can be called before the command actually executes, can be overriden by the extended command
	}

	afterExecute(ctx) {
		// default method that can be called after the command actually executes, can be overriden by the extended command
		const {cyan, green, gray} = ctx.logger.chalk;
		ctx.logger.info(`Command ${cyan(ctx.command.name)} was ${green("executed")} by user ${ctx.user.tag} ${gray(`(${ctx.user.id})`)}.`);
	}

	didNotExecute(ctx, blockReason) {
		const reasons = {
			"global": () => " as this command is disabled globally.",
			"guild": () => " in this server.",
			"category-channel": id => ` in the ${ctx.guild.channels.cache.get(id).name} category.`,
			"text-channel": id => ` in the #${ctx.guild.channels.cache.get(id).name} channel.`,
			"voice-channel": id => ` in the ${ctx.guild.channels.cache.get(id).name} voice channel.`,
			"role": id => ` with the ${ctx.guild.roles.cache.get(id).name} role.`,
			"user": () => "."
		};
		const {cyan, red, gray} = ctx.logger.chalk;
		ctx.embed({ description: `You aren't allowed to use this command${reasons[blockReason.type](blockReason.id)}` });
		ctx.logger.info(`Command ${cyan(ctx.command.name)} was ${red("not executed")} by user ${ctx.user.tag} ${gray(`(${ctx.user.id})`)}${reasons[blockReason.type](blockReason.id)}`);
	}

	async run(...args) {
		const context = await this.client.context.commandMessage(...args);
		let commandPermissions = this.checkGlobalCommandPermissions(context);
		if (commandPermissions.permitted && context.guild)
			commandPermissions = this.checkGuildCommandPermissions(context);
		if (commandPermissions.permitted) {
			await this.beforeExecute(context);
			await this.task(context).catch(context.logger.error);
			await this.afterExecute(context);
		}
		if (!commandPermissions.permitted) {
			await this.didNotExecute(context, commandPermissions.blockReason);
		}
	}
};