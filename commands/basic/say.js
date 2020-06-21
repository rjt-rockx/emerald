const BaseCommand = require("../../src/base/baseCommand.js");

module.exports = class Say extends BaseCommand {
	constructor(client) {
		super(client, {
			name: "say",
			group: "basic",
			description: "Make the bot say something.",
			clientPermissions: ["SEND_MESSAGES", "EMBED_LINKS"],
			args: [
				{
					key: "channel",
					prompt: "Channel to send the message in.",
					type: "channel"
				},
				{
					key: "message",
					prompt: "Message to be sent in that channel.",
					type: "string",
					validate: v => v.length > 0
				}
			]
		});
	}

	async task(ctx) {
		if (ctx.args.channel.type !== "text" && ctx.args.channel.type !== "news")
			return ctx.embed({ description: "Invalid channel specified." });
		if (!ctx.args.channel.permissionsFor(ctx.client.user).has(["VIEW_CHANNEL", "SEND_MESSAGES", "READ_MESSAGE_HISTORY", "EMBED_LINKS"]))
			return ctx.embed({ description: "The bot isn't allowed to send messages there." });
		if (!ctx.args.channel.permissionsFor(ctx.user).has(["VIEW_CHANNEL", "SEND_MESSAGES", "READ_MESSAGE_HISTORY"]))
			return ctx.embed({ description: "You aren't allowed to send messages there." });
		return ctx.args.channel.send(ctx.args.message);
	}
};