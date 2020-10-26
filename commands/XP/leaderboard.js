const BaseCommand = require("../../src/base/baseCommand.js");

module.exports = class Leaderboard extends BaseCommand {
	constructor(client) {
		super(client, {
			name: "leaderboard",
			aliases: ["lb", "xplb"],
			group: "xp",
			description: "Get the XP leaderboard of this server.",
			clientPermissions: ["SEND_MESSAGES", "EMBED_LINKS"],
			args: [
				{
					key: "page",
					prompt: "Page number of the leaderboard to go to",
					type: "integer",
					default: 1
				}
			]
		});
	}

	async task(ctx) {
		const xpData = ctx.guildStorage.get("xp") || ctx.guildStorage.set("xp", {});
		if (!xpData || !Object.keys(xpData).length)
			return ctx.embed("No XP data available for this server.");
		const guildXpData = ctx.services.xp.getXPData(ctx.guild.id);
		const lbFields = Object.entries(guildXpData)
			.map(([uid, xpData]) => ({
				name: `${xpData.rank}. ${ctx.client.users.cache.has(uid) ? ctx.client.users.cache.get(uid).tag : uid}`,
				value: `Level ${xpData.level} | ${xpData.total} XP`,
				inline: false
			}));
		return ctx.paginate(lbFields, {
			chunkSize: 10,
			defaultPage: ctx.args.page,
			embedTemplate: {
				title: `XP Leaderboard for ${ctx.guild.name}`,
				thumbnail: {
					url: ctx.guild.iconURL({ format: "png", size: 512, dynamic: true })
				}
			}
		});
	}
};