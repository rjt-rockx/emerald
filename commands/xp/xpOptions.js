
const BaseCommand = require("../../src/base/baseCommand.js");

module.exports = class XPOptions extends BaseCommand {
	constructor(client) {
		super(client, {
			name: "xpoptions",
			description: "Configure various options for XP.",
			group: "xp",
			aliases: ["xpopts"],
			clientPermissions: ["SEND_MESSAGES", "EMBED_LINKS"],
			userPermissions: ["MANAGE_GUILD"],
			args: [
				{
					key: "option",
					prompt: "XP option to set (one of 'messageConsidered', 'minuteInterval', 'maxCharCount', 'globalMultiplier')",
					type: "string",
					oneOf: ["messageConsidered", "minuteInterval", "maxCharCount", "globalMultiplier"]
				},
				{
					key: "value",
					prompt: "Value to set for the option",
					type: "integer|string"
				}
			]
		});
	}

	async task(ctx) {
		let xpOptions = ctx.guildStorage.get("xpOptions") || ctx.guildStorage.set("xpOptions", {});
		const newOption = { [ctx.args.option]: ctx.args.value };
		if (!ctx.services.xp.validateXpOptions(newOption))
			return ctx.embed("Invalid value specified.");
		xpOptions = { ...xpOptions, ...newOption };
		ctx.services.xp.updateXpOptions(ctx.guild.id, xpOptions);
		ctx.guildStorage.set("xpOptions", xpOptions);
		return ctx.embed("XP Options successfully updated.");
	}
};
