const BaseCommand = require("../../src/base/baseCommand.js");

module.exports = class BotClear extends BaseCommand {
	constructor(client) {
		super(client, {
			name: "botclearprefixes",
			aliases: ["botclearprefix", "bcprefixes", "bcprefix"],
			group: "utils",
			description: "Add, remove or list the prefixes configured for botclear.",
			args: [
				{
					key: "action",
					prompt: "Whether to add/remove/list prefixes",
					type: "string",
					oneOf: ["add", "remove", "list"]
				},
				{
					key: "prefix",
					prompt: "Prefix to add/remove",
					type: "string",
					default: ""
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
		let prefixes = ctx.guildStorage.get("botPrefixes") || ctx.guildStorage.set("botPrefixes", []);
		if (ctx.args.action === "add") {
			if (!ctx.args.prefix)
				return ctx.embed({ description: "Invalid prefix specified." });
			if (prefixes.includes(ctx.args.prefix.toLowerCase()))
				return ctx.send({ description: "The given botclear prefix already exists." });
			prefixes = [...new Set([...prefixes, ctx.args.prefix.toLowerCase()])];
			ctx.guildStorage.set("botPrefixes", prefixes);
			return ctx.embed({
				title: `Prefix ${ctx.args.prefix.toLowerCase()} successfully added.`,
				fields: [
					{
						name: `Current botclear prefixes (${prefixes.length})`,
						value: prefixes.length > 0 ? prefixes.map(prefix => `\`${prefix}\``).join(", ") : "No botclear prefixes exist."
					}
				]
			});
		}
		else if (ctx.args.action === "remove") {
			if (!ctx.args.prefix)
				return ctx.embed({ description: "Invalid prefix specified." });
			if (!prefixes.includes(ctx.args.prefix.toLowerCase()))
				return ctx.embed({ description: "The given botclear prefix does not exist." });
			prefixes = prefixes.filter(p => p !== ctx.args.prefix.toLowerCase());
			prefixes = [...new Set(prefixes)];
			ctx.guildStorage.set("botPrefixes", prefixes);
			return ctx.embed({
				title: `Prefix ${ctx.args.prefix.toLowerCase()} successfully removed.`,
				fields: [
					{
						name: `Current botclear prefixes (${prefixes.length})`,
						value: prefixes.length > 0 ? prefixes.map(prefix => `\`${prefix}\``).join(", ") : "No botclear prefixes exist."
					}
				]
			});
		}
		else if (ctx.args.action === "list") {
			return ctx.embed({
				fields: [
					{
						name: `Current botclear prefixes (${prefixes.length})`,
						value: prefixes.length > 0 ? prefixes.map(prefix => `\`${prefix}\``).join(", ") : "No botclear prefixes exist."
					}
				]
			});
		}
	}
};
