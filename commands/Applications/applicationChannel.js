const BaseCommand = require("../../src/base/baseCommand.js");

module.exports = class ApplicationChannel extends BaseCommand {
	constructor(client) {
		super(client, {
			name: "applicationchannel",
			group: "applications",
			description: "Get, set or remove the channel to react with approval/denial reactions in this guild.",
			aliases: ["appch"],
			userPermissions: ["MANAGE_CHANNELS"],
			args: [
				{
					key: "action",
					prompt: "Get, set or remove the application channel.",
					type: "string",
					oneOf: ["get", "set", "remove"],
					default: "get"
				},
				{
					key: "channel",
					prompt: "Channel to react in",
					type: "channel",
					default: ""
				}
			]
		});
	}

	async task(ctx) {
		const applicationChannelID = ctx.guildStorage.get("applicationChannel");
		const applicationChannel = ctx.guild.channels.cache.get(applicationChannelID);
		const requiredPermissions = ["SEND_MESSAGES", "ATTACH_FILES", "EMBED_LINKS", "ADD_REACTIONS"];
		if (ctx.args.action === "get" && !applicationChannelID)
			return ctx.embed({ description: "No application channel set for this guild." });
		else if (ctx.args.action === "get" && applicationChannelID) {
			if (!applicationChannel) {
				ctx.guildStorage.delete("applicationChannel");
				return ctx.embed({ description: "Application channel does not exist, removing." });
			}
			else if (applicationChannel && !applicationChannel.permissionsFor(ctx.client.user).has(requiredPermissions)) {
				ctx.guildStorage.delete("applicationChannel");
				return ctx.embed({ description: "Bot has insufficient permissions in the current application channel, removing." });
			}
			else return ctx.embed({ description: `Application channel currently set to ${applicationChannel}.` });
		}
		else if (ctx.args.action === "set") {
			if (!ctx.args.channel || ctx.args.channel.type !== "text")
				return ctx.embed({ description: "Invalid channel specified." });
			else if (ctx.args.channel && applicationChannelID === ctx.args.channel.id) {
				if (applicationChannel && !applicationChannel.permissionsFor(ctx.client.user).has(requiredPermissions)) {
					ctx.guildStorage.delete("applicationChannel");
					return ctx.embed({ description: "Bot has insufficient permissions in the given application channel, removing." });
				}
				else return ctx.embed({ description: `Application channel already set to ${ctx.args.channel}.` });
			}
			else if (ctx.args.channel && applicationChannelID !== ctx.args.channel.id) {
				if (!ctx.args.channel.permissionsFor(ctx.client.user).has(requiredPermissions)) {
					ctx.guildStorage.delete("applicationChannel");
					return ctx.embed({ description: "Bot has insufficient permissions in the given application channel, removing." });
				}
				else {
					ctx.guildStorage.set("applicationChannel", ctx.args.channel.id);
					return ctx.embed({ description: `Application channel successfully set to ${ctx.args.channel}.` });
				}
			}
		}
		else if (ctx.args.action === "remove") {
			ctx.guildStorage.delete("applicationChannel");
			return ctx.embed({ description: "Application channel successfully removed." });
		}
	}
};