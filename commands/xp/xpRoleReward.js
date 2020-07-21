const BaseCommand = require("../../src/base/baseCommand.js");

module.exports = class XPRoleReward extends BaseCommand {
	constructor(client) {
		super(client, {
			name: "xprolereward",
			aliases: ["xprr"],
			group: "xp",
			description: "List, set or remove a role to be rewarded at a particular XP level.",
			clientPermissions: ["SEND_MESSAGES", "EMBED_LINKS", "MANAGE_ROLES"],
			userPermissions: ["MANAGE_ROLES", "MANAGE_GUILD"],
			args: [
				{
					key: "action",
					prompt: "List, set or remove a role",
					type: "string",
					oneOf: ["list", "set", "remove"],
					default: "list"
				},
				{
					key: "level",
					prompt: "Level to reward the role for",
					type: "integer",
					default: ""
				},
				{
					key: "role",
					prompt: "Role to reward",
					type: "role",
					default: ""
				}
			]
		});
	}

	async task(ctx) {
		const xpRoleRewards = ctx.guildStorage.get("xpRoleRewards") || ctx.guildStorage.set("xpRoleRewards", {});
		if (ctx.args.action === "list") {
			const entries = Object.entries(xpRoleRewards);
			if (!entries.length)
				return ctx.embed("No rewards set.");
			const fields = entries.map(([key, value]) => ({ name: `Level ${key.split("_")[1]}`, value: ctx.guild.roles.cache.has(value) ? ctx.guild.roles.cache.get(value).name : value }));
			return ctx.paginate(fields, {
				embedTemplate: { title: `XP role rewards for ${ctx.guild.name}` }, thumbnail: { url: ctx.guild.iconURL({ size: 512, format: "png", dynamic: true }) }
			});
		}
		else if (ctx.args.action === "set") {
			if (!ctx.args.level)
				return ctx.embed("Invalid level specified.");
			if (!ctx.args.role)
				return ctx.embed("Invalid role specified.");
			const levelID = `level_${ctx.args.level}`;
			xpRoleRewards[levelID] = ctx.args.role.id;
			ctx.guildStorage.set("xpRoleRewards", xpRoleRewards);
			return ctx.embed(`Role reward for level ${ctx.args.level} set to the ${ctx.args.role.name} role.`);
		}
		else if (ctx.args.action === "remove") {
			if (!ctx.args.level)
				return ctx.embed("Invalid level specified.");
			const levelID = `level_${ctx.args.level}`;
			if (!Object.keys(xpRoleRewards).length)
				return ctx.embed("No role rewards set.");
			delete xpRoleRewards[levelID];
			ctx.guildStorage.set("xpRoleRewards", xpRoleRewards);
			return ctx.embed(`Role reward for level ${ctx.args.level} removed.`);
		}
	}
};