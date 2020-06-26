const { TextChannel } = require("discord.js");
const BaseCommand = require("../../src/base/baseCommand.js");

module.exports = class ReactionLog extends BaseCommand {
	constructor(client) {
		super(client, {
			name: "reactionlog",
			description: "Enable or disable reaction logging in a particular channel.",
			group: "logs",
			userPermissions: ["MANAGE_CHANNELS", "MANAGE_GUILD"],
			clientPermissions: ["VIEW_CHANNEL", "SEND_MESSAGES", "EMBED_LINKS"],
			args: [
				{
					key: "enabled",
					prompt: "Whether to enable or disable reaction logging.",
					type: "string",
					oneOf: ["enable", "disable"]
				},
				{
					key: "channel",
					prompt: "Channel to log reactions in.",
					type: "text-channel",
					default: ""
				}
			]
		});
	}

	async task(ctx) {
		let logChannel = ctx.guildStorage.get("reactionLogChannel");
		if (ctx.args.enabled === "enable") {
			if (!ctx.args.channel) {
				if (!logChannel) return ctx.embed({ description: "Invalid reaction log channel specified." });
				if (ctx.guild.channels.cache.has(logChannel)) {
					const perms = ctx.client.channels.cache.get(logChannel).permissionsFor(ctx.client.user);
					if (!perms || !perms.has(["VIEW_CHANNEL", "SEND_MESSAGES", "EMBED_LINKS"])) {
						logChannel = ctx.guildStorage.set("reactionLogChannel", null);
						return ctx.embed({ description: "Invalid permissions." });
					}
					return ctx.embed({ description: `Reaction log channel successfully set to #${ctx.guild.channels.cache.get(logChannel).name}.` });
				}
			}
			else if ((ctx.args.channel instanceof TextChannel) && ctx.guild.channels.cache.has(ctx.args.channel.id)) {
				const perms = ctx.args.channel.permissionsFor(ctx.client.user);
				if (!perms || !perms.has(["VIEW_CHANNEL", "SEND_MESSAGES", "EMBED_LINKS"])) {
					logChannel = ctx.guildStorage.set("reactionLogChannel", null);
					return ctx.embed({ description: "Invalid permissions." });
				}
				ctx.guildStorage.set("reactionLogChannel", logChannel = ctx.args.channel.id);
				return ctx.embed({ description: `Reaction log channel successfully set to #${ctx.guild.channels.cache.get(logChannel).name}.` });
			}
		}
		else if (ctx.args.enabled === "disable") {
			logChannel = ctx.guildStorage.set("reactionLogChannel", null);
			return ctx.embed({ description: "Reaction log channel successfully disabled." });
		}
	}
};
