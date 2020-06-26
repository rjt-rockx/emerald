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
		if (ctx.args.action === "get" && !archiveChannelID)
			return ctx.embed({ description: "No archive channel set for this guild." });
		else if (ctx.args.action === "get" && archiveChannelID) {
			if (!archiveChannel) {
				ctx.guildStorage.delete("archiveChannel");
				return ctx.embed({ description: "Archive channel does not exist, removing." });
			}
			else if (archiveChannel && !archiveChannel.permissionsFor(ctx.client.user).has(requiredPermissions)) {
				ctx.guildStorage.delete("archiveChannel");
				return ctx.embed({ description: "Bot has insufficient permissions in the current archive channel, removing." });
			}
			else return ctx.embed({ description: `Archive channel currently set to ${archiveChannel}.` });
		}
		else if (ctx.args.action === "set") {
			if (!ctx.args.channel || ctx.args.channel.type !== "text")
				return ctx.embed({ description: "Invalid channel specified." });
			else if (ctx.args.channel && archiveChannelID === ctx.args.channel.id) {
				if (archiveChannel && !archiveChannel.permissionsFor(ctx.client.user).has(requiredPermissions)) {
					ctx.guildStorage.delete("archiveChannel");
					return ctx.embed({ description: "Bot has insufficient permissions in the given archive channel, removing." });
				}
				else ctx.embed({ description: `Archive channel already set to ${ctx.args.channel}.` });
			}
			else if (ctx.args.channel && archiveChannelID !== ctx.args.channel.id) {
				if (!ctx.args.channel.permissionsFor(ctx.client.user).has(requiredPermissions)) {
					ctx.guildStorage.delete("archiveChannel");
					return ctx.embed({ description: "Bot has insufficient permissions in the given archive channel, removing." });
				}
				else {
					ctx.guildStorage.set("archiveChannel", ctx.args.channel.id);
					return ctx.embed({ description: `Archive channel successfully set to ${ctx.args.channel}.` });
				}
			}
		}
		else if (ctx.args.action === "remove") {
			ctx.guildStorage.delete("archiveChannel");
			return ctx.embed({ description: "Archive channel successfully removed." });
		}
	}
};