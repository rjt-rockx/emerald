const BaseCommand = require("../../src/base/baseCommand.js");

module.exports = class Ping extends BaseCommand {
	constructor(client) {
		super(client, {
			name: "ping",
			group: "bot",
			description: "Get the ping of the bot.",
			clientPermissions: ["SEND_MESSAGES", "EMBED_LINKS"]
		});
	}

	async task(ctx) {
		const pingMessage = await ctx.embed({ description: "Pinging ..." });
		return pingMessage.edit({
			embed: {
				fields: [
					{ name: "Message Ping", value: `${Math.round(pingMessage.createdTimestamp - ctx.message.createdTimestamp)}ms`, inline: true },
					{ name: "Websocket Ping", value: `${Math.round(ctx.client.ws.ping)}ms`, inline: true }
				]
			}
		});
	}
};