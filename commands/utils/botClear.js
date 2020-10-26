const BaseCommand = require("../../src/base/baseCommand.js");

module.exports = class BotClear extends BaseCommand {
	constructor(client) {
		super(client, {
			name: "botclear",
			aliases: ["bc"],
			group: "utils",
			description: "Clear bot messages as well as messages starting with specific prefixes.",
			args: [
				{
					key: "amount",
					prompt: "Amount of messages to clear. (Max: 50)",
					type: "integer",
					default: 25
				},
				{
					key: "ignorepins",
					prompt: "Whether to ignore pinned messages or not.",
					type: "boolean",
					default: false
				}
			],
			clientPermissions: [
				"READ_MESSAGE_HISTORY",
				"MANAGE_MESSAGES"
			],
			userPermissions: ["MANAGE_MESSAGES"]
		});
	}

	async task(ctx) {
		if (ctx.args.amount > 50)
			return ctx.embed({ description: "Cannot clear more than 50 messages at once." });
		const prefixes = ctx.guildStorage.get("botPrefixes") || ctx.guildStorage.set("botPrefixes", []);
		try {
			let messages = await ctx.channel.messages.fetch({ limit: ctx.args.amount, before: ctx.message.id });
			if (ctx.args.ignorepins)
				messages = messages.filter(message => !message.pinned);
			messages = messages.filter(message => message.author.bot || (prefixes.length > 0 && prefixes.some(prefix => message.cleanContent.toLowerCase().startsWith(prefix))));
			if (messages.length < 1)
				return ctx.selfDestruct("No bot messages were found.", 5);
			await ctx.message.delete().catch();
			await ctx.channel.bulkDelete(messages, true);
			return ctx.selfDestruct(`Deleted ${messages.size} bot messages in the last ${ctx.args.amount} messages.`, 5);
		}
		catch (error) {
			return ctx.embed({ description: "Unable to delete messages." });
		}
	}
};
