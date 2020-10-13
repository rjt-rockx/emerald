const BaseCommand = require("../../src/base/baseCommand.js");
const getDuration = require("pretty-ms");
const { Role } = require("discord.js");

module.exports = class ExpireMessages extends BaseCommand {
	constructor(client) {
		super(client, {
			name: "expiremessages",
			description: "Delete messages in a particular channel after a certain duration.",
			group: "misc",
			userPermissions: ["MANAGE_GUILD", "MANAGE_CHANNELS", "MANAGE_MESSAGES"],
			clientPermissions: ["VIEW_CHANNEL", "SEND_MESSAGES", "EMBED_LINKS", "MANAGE_MESSAGES"],
			args: [
				{
					key: "enabled",
					prompt: "Whether to enable or disable message expiry.",
					type: "string",
					oneOf: ["enable", "disable"]
				},
				{
					key: "channel",
					prompt: "Channel to delete expired messages from.",
					type: "channel"
				},
				{
					key: "duration",
					prompt: "Duration to delete messages after.",
					type: "duration",
					default: "1h"
				},
				{
					key: "ignoredRoles",
					prompt: "Roles to ignore messages from.",
					type: "role",
					default: "",
					infinite: true
				}
			]
		});
	}

	async task(ctx) {
		if (!["news", "text"].includes(ctx.args.channel.type))
			ctx.embed("Invalid channel type specified.");
		let messageExpiryChannels = ctx.guildStorage.get("messageExpiryChannels") || ctx.guildStorage.set("messageExpiryChannels", []);
		if (ctx.args.enabled === "enable") {
			if (!ctx.args.channel.permissionsFor(ctx.botMember).has("MANAGE_MESSAGES")) {
				messageExpiryChannels = messageExpiryChannels.filter(({ id }) => id !== ctx.args.channel.id);
				ctx.guildStorage.set("messageExpiryChannels", messageExpiryChannels);
				ctx.services.messageexpiry.purgeDeleteQueue(ctx.args.channel.id);
				return ctx.embed(`The bot does not have the Manage Messages permission in ${ctx.args.channel}`);
			}
			messageExpiryChannels = messageExpiryChannels.filter(({ id }) => id !== ctx.args.channel.id);

			const hasIgnoredRoles = Array.isArray(ctx.args.ignoredRoles) && ctx.args.ignoredRoles.every(e => e instanceof Role);
			if (hasIgnoredRoles)
				messageExpiryChannels.push({ id: ctx.args.channel.id, duration: ctx.args.duration, ignoredRoles: ctx.args.ignoredRoles.map(r => r.id) });
			else messageExpiryChannels.push({ id: ctx.args.channel.id, duration: ctx.args.duration });

			ctx.guildStorage.set("messageExpiryChannels", messageExpiryChannels);
			ctx.services.messageexpiry.purgeDeleteQueue(ctx.args.channel.id);
			return ctx.embed([
				`Messages ${hasIgnoredRoles ? "not sent by the following roles" : "sent"} in ${ctx.args.channel} will be deleted after ${getDuration(ctx.args.duration, { verbose: true })}`,
				hasIgnoredRoles ? ctx.args.ignoredRoles.map(r => r.name).join(", ") : ""
			].join("\n"));
		}
		else if (ctx.args.enabled === "disable") {
			messageExpiryChannels = messageExpiryChannels.filter(({ id }) => id !== ctx.args.channel.id);
			ctx.guildStorage.set("messageExpiryChannels", messageExpiryChannels);
			ctx.services.messageexpiry.purgeDeleteQueue(ctx.args.channel.id);
			return ctx.embed(`Messages sent in ${ctx.args.channel} won't be deleted anymore when they expire.`);
		}
	}
};
