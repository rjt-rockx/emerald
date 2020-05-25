const BaseCommand = require("../../src/base/baseCommand.js");

module.exports = class ArchiveChannel extends BaseCommand {
	constructor(client) {
		super(client, {
			name: "archivechannel",
			group: "applications",
			description: "Get, set or remove the archive channel for this guild.",
			aliases: ["archch"],
			userPermissions: ["MANAGE_CHANNELS"],
			args: [
				{
					key: "action",
					prompt: "Get, set or remove the archive channel.",
					type: "string",
					oneOf: ["get", "set", "remove"],
					default: "get"
				},
				{
					key: "channel",
					prompt: "Channel to archive applications in",
					type: "channel",
					default: ""
				}
			]
		});
	}

	async task(ctx) {
		const archiveChannelID = ctx.guildStorage.get("archiveChannel");
		const archiveChannel = ctx.guild.channels.cache.get(archiveChannelID);
		const requiredPermissions = ["SEND_MESSAGES", "ATTACH_FILES", "EMBED_LINKS", "ADD_REACTIONS"];
		if (ctx.args.action === "get" && !archiveChannelID) {
			ctx.embed({ description: "No archive channel set for this guild." });
		}
		else if (ctx.args.action === "get" && archiveChannelID) {
			if (!archiveChannel) {
				ctx.embed({ description: "archive channel does not exist, removing." });
				ctx.guildStorage.delete("archiveChannel");
			}
			else if (archiveChannel && archiveChannel.permissionsFor(ctx.client.user).has(requiredPermissions)) {
				ctx.embed({ description: "Bot has insufficient permissions in the current archive channel, removing." });
				ctx.guildStorage.delete("archiveChannel");
			}
			else ctx.embed({ description: `archive channel currently set to ${archiveChannel}.` });
		}
		else if (ctx.args.action === "set") {
			if (!ctx.args.channel || ctx.args.channel.type !== "text")
				ctx.embed({ description: "Invalid channel specified." });
			else if (ctx.args.channel && archiveChannelID === ctx.args.channel.id) {
				if (archiveChannel && archiveChannel.permissionsFor(ctx.client.user).has(requiredPermissions)) {
					ctx.embed({ description: "Bot has insufficient permissions in the given archive channel, removing." });
					ctx.guildStorage.delete("archiveChannel");
				}
				else ctx.embed({ description: `archive channel already set to ${ctx.args.channel}.` });
			}
			else if (ctx.args.channel && archiveChannelID !== ctx.args.channel.id) {
				if (!ctx.args.channel.permissionsFor(ctx.client.user).has(requiredPermissions)) {
					ctx.embed({ description: "Bot has insufficient permissions in the given archive channel, removing." });
					ctx.guildStorage.delete("archiveChannel");
				}
				else {
					ctx.guildStorage.set("archiveChannel", ctx.args.channel.id);
					ctx.embed({ description: `archive channel successfully set to ${ctx.args.channel}.` });
				}
			}
		}
		else if (ctx.args.action === "remove") {
			ctx.guildStorage.delete("archiveChannel");
			ctx.embed({ description: "archive channel successfully removed." });
		}
	}
};