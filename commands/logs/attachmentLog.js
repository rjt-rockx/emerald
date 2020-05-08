const { TextChannel } = require("discord.js");
const BaseCommand = require("../../src/base/baseCommand.js");

module.exports = class AttachmentLog extends BaseCommand {
	constructor(client) {
		super(client, {
			name: "attachmentlog",
			description: "Enable or disable attachment logging in a particular channel.",
			group: "logs",
			userPermissions: ["ADMINISTRATOR"],
			clientPermissions: ["VIEW_CHANNEL", "SEND_MESSAGES", "ATTACH_FILES", "EMBED_LINKS"],
			args: [
				{
					key: "enabled",
					prompt: "Whether to enable or disable attachment logging.",
					type: "string",
					oneOf: ["enable", "disable"]
				},
				{
					key: "channel",
					prompt: "Channel to log attachments in.",
					type: "text-channel",
					default: "none"
				}
			]
		});
	}

	async task(ctx) {
		let logChannel = ctx.guildStorage.get("attachmentLogChannel");
		if (ctx.args.enabled === "enable") {
			if (ctx.args.channel === "none") {
				if (!logChannel) return ctx.embed({ description: "Invalid attachment log channel specified." });
				if (ctx.guild.channels.cache.has(logChannel)) {
					const perms = ctx.client.channels.cache.get(logChannel).permissionsFor(ctx.client.user);
					if (!perms || !perms.has(["VIEW_CHANNEL", "SEND_MESSAGES", "ATTACH_FILES", "EMBED_LINKS"])) {
						logChannel = ctx.guildStorage.set("attachmentLogChannel", null);
						return ctx.embed({ description: "Invalid permissions." });
					}
					return ctx.embed({ description: `Attachment log channel successfully set to #${ctx.guild.channels.cache.get(logChannel).name}.` });
				}
			}
			else if ((ctx.args.channel instanceof TextChannel) && ctx.guild.channels.cache.has(ctx.args.channel.id)) {
				const perms = ctx.args.channel.permissionsFor(ctx.client.user);
				if (!perms || !perms.has(["VIEW_CHANNEL", "SEND_MESSAGES", "ATTACH_FILES", "EMBED_LINKS"])) {
					logChannel = ctx.guildStorage.set("attachmentLogChannel", null);
					return ctx.embed({ description: "Invalid permissions." });
				}
				ctx.guildStorage.set("attachmentLogChannel", logChannel = ctx.args.channel.id);
				return ctx.embed({ description: `Attachment log channel successfully set to #${ctx.guild.channels.cache.get(logChannel).name}.` });
			}
		}
		else if (ctx.args.enabled === "disable") {
			logChannel = ctx.guildStorage.set("attachmentLogChannel", null);
			return ctx.embed({ description: "Attachment log channel successfully disabled." });
		}
	}
};
