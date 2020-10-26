const BaseCommand = require("../../src/base/baseCommand.js");

module.exports = class XP extends BaseCommand {
	constructor(client) {
		super(client, {
			name: "xp",
			group: "xp",
			description: "Get the XP of a member.",
			clientPermissions: ["SEND_MESSAGES", "EMBED_LINKS"],
			args: [
				{
					key: "user",
					prompt: "User to get the XP data of",
					type: "user",
					default: "self"
				}
			]
		});
	}

	async task(ctx) {
		const user = ctx.args.user === "self" ? ctx.user : ctx.args.user;
		const xpService = ctx.services.xp;
		const xpOptions = ctx.guildStorage.get("xpOptions") || ctx.guildStorage.set("xpOptions", xpService.defaultXpOptions);
		if (!xpOptions.enabled)
			return ctx.embed("XP is not enabled for this server.");
		const userXpData = xpService.getXPData(ctx.guild.id, user.id);
		if (!userXpData)
			return ctx.embed("No XP data found.");
		return ctx.embed({
			author: {
				iconURL: ctx.guild.iconURL({ dynamic: true, size: 128, format: "png" }),
				name: `Server XP for ${user.tag}`
			},
			thumbnail: { url: user.displayAvatarURL({ size: 512, format: "png", dynamic: true }) },
			fields: [
				{
					name: "Current level",
					value: `Level ${userXpData.level} (${userXpData.total} XP)`,
					inline: true
				},
				{
					name: "Server ranking",
					value: `Rank ${userXpData.rank} of ${userXpData.totalRanks}`,
					inline: true
				},
				{
					name: `Progress to level ${userXpData.level+1}`,
					value: `${userXpData.progress} XP/${userXpData.required} XP (${userXpData.required - userXpData.progress} XP needed)`,
					inline: false
				}
			]
		});
	}
};