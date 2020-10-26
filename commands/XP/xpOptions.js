
const BaseCommand = require("../../src/base/baseCommand.js");

module.exports = class XPOptions extends BaseCommand {
	constructor(client) {
		super(client, {
			name: "xpoptions",
			description: [
				"Configure various options for XP.",
				"Available options:",
				"`messageConsidered` - Message length to be considered for XP gain. Can be either the `first` message length, the `longest` message length or the `average` message length.",
				"`minuteInterval` - Interval (in minutes) at which XP can be gained. Should be between `1` and `60`.",
				"`maxCharCount` - Maximum characters counted in a message. Should be less than `2000`.",
				"`globalMultiplier` - Multiplier to be applied for XP gain globally on this server. Default is `1`."
			].join("\n"),
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
