const BaseService = require("../src/base/baseService.js");

module.exports = class AutoPublish extends BaseService {
	constructor(client) {
		super(client, {
			name: "AutoPublish Service",
			description: "Automatically publishes non-bot messages sent in a news channel.",
			enabled: true,
			fetchPartials: true,
			guildOnly: true
		});
	}

	async onMessage(ctx) {
		const autoPublishChannels = ctx.guildStorage.get("autoPublishChannels") || ctx.guildStorage.set("autoPublishChannels", []);
		if (autoPublishChannels.includes(ctx.channel.id) && ctx.channel.type === "news")
			ctx.message.crosspost();
	}
};