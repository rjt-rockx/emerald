const BaseService = require("../src/base/baseService.js");
const { GuildMember } = require("discord.js");

module.exports = class NCRoleRewards extends BaseService {
	constructor(client) {
		super(client, {
			name: "NadekoConnector Role Rewards",
			description: "Persists/stacks NadekoConnector XP Role Rewards for each enabled guild.",
			enabled: true,
			guildOnly: true,
			fetchPartials: true
		});
	}

	everyHalfAnHour(timeContext) {
		for (const guild of this.client.guilds.cache.values()) {
			const ctx = timeContext.clone({ guild });
			if (!ctx.nadekoConnector || !ctx.guildStorage.get("ncpersistxprolerews"))
				continue;
			this.syncRoleRewards(ctx, ctx.guildStorage.get("ncstackxprolerews"));
		}
	}

	async syncRoleRewards(ctx, stack) {
		const roleRewards = await ctx.nadekoConnector.getGuildXpRoleRewards(ctx.guild.id, 0, ctx.guild.roles.cache.size);
		const leaderboard = await ctx.nadekoConnector.getGuildXpLeaderboard(ctx.guild.id, 0, ctx.guild.members.cache.size);
		if (!roleRewards || !leaderboard) return;

		for (const lbUser of leaderboard) {
			let member;
			if (!ctx.guild.members.cache.has(lbUser.userId)) {
				try { member = await ctx.guild.members.fetch(lbUser.userId); }
				catch (err) { continue; }
			}
			else member = ctx.guild.members.cache.get(lbUser.userId);
			if (!member || !(member instanceof GuildMember))
				continue;

			const rolesToAssign = this.rolesToAssign(roleRewards, lbUser.level, stack);
			for (const [roleId, shouldHave] of Object.entries(rolesToAssign)) {
				if (!member.roles.cache.has(roleId) && shouldHave)
					await member.roles.add(roleId);
				else if (member.roles.cache.has(roleId) && !shouldHave)
					await member.roles.remove(roleId);
			}
		}
	}

	rolesToAssign(roles, level, stack) {
		if (stack)
			return Object.fromEntries(roles.map(role => [role.roleId, role.level <= level]));
		if (!stack) {
			const toAssign = Object.fromEntries(roles.map(role => [role.roleId, false]));
			let lastActiveRoleId;
			for (const role of roles.sort((a, b) => a.level - b.level))
				if (role.level <= level)
					lastActiveRoleId = role.roleId;
			return lastActiveRoleId ? { ...toAssign, [lastActiveRoleId]: true } : toAssign;
		}
	}
};