const BaseCommand = require("../../src/base/baseCommand.js");

module.exports = class Prefix extends BaseCommand {
	constructor(client) {
		super(client, {
			name: "prefix",
			group: "basic",
			description: "Get or set the prefix for this guild.",
			clientPermissions: ["SEND_MESSAGES", "EMBED_LINKS"],
			userPermissions: ["ADMINISTRATOR"],
			args: [
				{
					key: "prefix",
					prompt: "New prefix to set, if any.",
					type: "string",
					default: ""
				}
			]
		});
	}

	async task(ctx) {
		const currentPrefix = ctx.guildStorage.get("commandPrefix");
		if (!ctx.args.prefix)
			return ctx.embed({ title: "Guild prefix", description: `Command prefix for this guild is currently set to \`${currentPrefix}\`` });
		if (ctx.args.prefix.length > 16)
			return ctx.embed({ description: "Prefix must be less than 16 characters long." });
		ctx.guild.commandPrefix = ctx.args.prefix;
		ctx.guildStorage.set("commandPrefix", ctx.args.prefix);
		return ctx.embed({ title: "Guild prefix", description: `Command prefix for this guild successfully set to \`${ctx.args.prefix}\`` });
	}
};