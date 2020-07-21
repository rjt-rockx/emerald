const BaseService = require("../src/base/baseService.js");

module.exports = class RoleReward extends BaseService {
	constructor(client) {
		super(client, {
			name: "Role Reward Service",
			description: "Reward roles on level up.",
			enabled: true,
			guildOnly: true,
			fetchPartials: true
		});
		this.defaultRoleOptions = { persistent: true, stack: false };
	}

	getRoles(xpRoleRewards, level) {
		if (!xpRoleRewards) return [];
		const rewards = Object.entries(xpRoleRewards);
		if (!rewards.length) return [];
		return rewards.sort((a, b) => +a[0].split("_")[1] - +b[0].split("_")[1]).reduce((roles, [levelID, roleID]) => {
			const levelToCheck = +(levelID.split("_")[1]);
			if (levelToCheck <= level)
				roles.push(roleID);
			return roles;
		}, []);
	}

	onLevelUp(ctx) {
		const xpRoleRewards = ctx.guildStorage.get("xpRoleRewards");
		const roles = this.getRoles(xpRoleRewards, ctx.level);
		let xpRoleOptions = ctx.guildStorage.get("xpRoleOptions") || ctx.guildStorage.set("xpRoleOptions", {});
		xpRoleOptions = { ...this.defaultRoleOptions, xpRoleOptions };
		this.addXPRoles(ctx, roles, !!xpRoleOptions.stack);
	}

	everyTenMinutes() {
		for (const guild of this.client.guilds.cache.values()) {
			const guildStorage = this.client.dataHandler.getGuildStorage(guild.id);

			const xpOptions = guildStorage.get("xpOptions");
			if (!xpOptions || !xpOptions.enabled)
				continue;

			const xpRoleOptions = guildStorage.get("xpRoleOptions");
			if (!xpRoleOptions || !xpRoleOptions.persistent)
				continue;

			const xpRoleRewards = guildStorage.get("xpRoleRewards");
			if (!xpRoleRewards)
				continue;

			const levelData = this.client.services.xp.getXPData(guild.id);
			for (const [userId, userLevelData] of Object.entries(levelData)) {
				if (!guild.members.cache.has(userId))
					continue;
				const member = guild.members.cache.get(userId);
				const { level } = userLevelData;
				if (!level) continue;
				const roles = this.getRoles(xpRoleRewards, level);
				if (!roles || !roles.length)
					continue;
				this.addXPRoles({ member }, roles, !!xpRoleOptions.stack);
			}
		}
	}

	addXPRoles({ member }, rewardRoles, stack) {
		if (!rewardRoles.length) return;
		const clonedRoles = [...new Set(rewardRoles)];
		if (!stack) {
			for (let i = 0; i < clonedRoles.length; i++) {
				if (i !== clonedRoles.length - 1 && member.roles.cache.has(clonedRoles[i])) {
					member.roles.remove(clonedRoles[i]).catch();
					continue;
				}
				if (i === clonedRoles.length - 1) {
					member.roles.add(clonedRoles[i]).catch();
					break;
				}
			}
		}
		else for (const role of clonedRoles) {
			if (!member.roles.cache.has(role))
				member.roles.add(role).catch();
		}
	}
};