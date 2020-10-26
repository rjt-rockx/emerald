
const BaseCommand = require("../../src/base/baseCommand.js");

module.exports = class ResetXP extends BaseCommand {
	constructor(client) {
		super(client, {
			name: "resetxp",
			description: "Reset XP for either a member or the whole server.",
			group: "xp",
			clientPermissions: ["SEND_MESSAGES", "EMBED_LINKS"],
			userPermissions: ["ADMINISTRATOR"],
			args: [
				{
					key: "user",
					prompt: "User to reset the XP data of",
					type: "user",
					default: "server"
				}
			]
		});
	}

	async task(ctx) {
		const xpData = ctx.guildStorage.get("xp");
		if (!xpData || !Object.keys(xpData).length)
			return ctx.embed("No XP data found for this server!");
		if (ctx.args.user === "server") {
			ctx.guildStorage.set("xp", {});
			return ctx.embed("XP data reset successfully for this server.");
		}
		else if (typeof ctx.args.user.id === "string") {
			if (Object.keys(xpData).includes(ctx.args.user.id)) {
				delete xpData[ctx.args.user.id];
				ctx.guildStorage.set("xp", xpData);
				return ctx.embed(`XP data reset sucessfully for ${ctx.args.user.tag}`);
			}
			else return ctx.embed(`No XP data found for ${ctx.args.user.tag}`);
		}
	}
};
