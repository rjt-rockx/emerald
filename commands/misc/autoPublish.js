const BaseCommand = require("../../src/base/baseCommand.js");

module.exports = class AutoPublish extends BaseCommand {
	constructor(client) {
		super(client, {
			name: "autopublish",
			description: "Automatically publish messages sent in a particular channel.",
			group: "misc",
			userPermissions: ["MANAGE_GUILD", "MANAGE_CHANNELS"],
			clientPermissions: ["VIEW_CHANNEL", "SEND_MESSAGES", "EMBED_LINKS"],
			args: [
				{
					key: "enabled",
					prompt: "Whether to enable or disable message publishing.",
					type: "string",
					oneOf: ["enable", "disable"]
				},
				{
					key: "channel",
					prompt: "Channel to automatically publish messages in.",
					type: "channel"
				}
			]
		});
	}

	async task(ctx) {
		if (ctx.args.channel.type !== "news")
			ctx.embed("Invalid channel type specified.");
		let autoPublishChannels = ctx.guildStorage.get("autoPublishChannels") || ctx.guildStorage.set("autoPublishChannels", []);
		if (ctx.args.enabled === "enable") {
			if (autoPublishChannels.includes(ctx.args.channel.id))
				return ctx.embed(`Messages sent in ${ctx.args.channel.name} are already being automatically published.`);
			autoPublishChannels.push(ctx.args.channel.id);
			ctx.guildStorage.set("autoPublishChannels", autoPublishChannels);
			return ctx.embed(`Messages sent in ${ctx.args.channel.name} will be automatically published from now on.`);
		}
		else if (ctx.args.enabled === "disable") {
			autoPublishChannels = autoPublishChannels.filter(id => id !== ctx.args.channel.id);
			ctx.guildStorage.set("autoPublishChannels", autoPublishChannels);
			return ctx.embed(`Messages sent in ${ctx.args.channel.name} won't be automatically published from now on.`);
		}
	}
};
