
const BaseCommand = require("../../src/base/baseCommand.js");

module.exports = class EnableXP extends BaseCommand {
	constructor(client) {
		super(client, {
			name: "enablexp",
			description: "Enable XP for this server.",
			group: "xp",
			clientPermissions: ["SEND_MESSAGES", "EMBED_LINKS"],
			userPermissions: ["MANAGE_GUILD"]
		});
	}

	async task(ctx) {
		const xpService = ctx.services.xp;
		const xpOptions = ctx.guildStorage.get("xpOptions") || ctx.guildStorage.set("xpOptions", xpService.defaultXpOptions);
		xpOptions.enabled = true;
		ctx.guildStorage.set("xpOptions", xpOptions);
		return ctx.embed("XP is now enabled for this server.");
	}
};
