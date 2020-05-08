const BaseCommand = require("../../src/base/baseCommand.js");

module.exports = class Say extends BaseCommand {
	constructor(client) {
		super(client, {
			name: "say",
			group: "basic",
			description: "Make the bot say something.",
			clientPermissions: ["SEND_MESSAGES", "EMBED_LINKS"],
			userPermissions: ["ADMINISTRATOR"],
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
		if (ctx.channel.type !== "text" && ctx.channel.type !== "news")
			return ctx.embed({ description: "Invalid channel specified." } );
		return ctx.send(ctx.args.message);
	}
};