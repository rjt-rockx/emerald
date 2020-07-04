const BaseService = require("../src/base/baseService.js");
const diff = require("../src/utilities/diffUtils.js");
const vibrant = require("node-vibrant");
const got = require("got");

module.exports = class RoleSync extends BaseService {
	constructor(client) {
		super(client, {
			name: "Role Sync Service",
			description: "Sync role colors to the user avatar on avatar change.",
			enabled: true
		});
	}

	async onUserUpdate(ctx) {
		const diffedUser = diff(ctx.oldUser, ctx.newUser);
		if (diffedUser.avatar) {
			for (const guild of [...ctx.client.guilds.cache.values()]) {
				const storage = ctx.client.dataHandler.getGuildStorage(guild.id);
				const syncedRoles = storage.get("syncedRoles");
				if (!syncedRoles || typeof syncedRoles !== "object" || !Object.values(syncedRoles).includes(ctx.newUser.id))
					continue;
				if (!guild.me || !guild.me.hasPermission("MANAGE_ROLES"))
					continue;
				const [roleID] = Object.entries(syncedRoles).find(([_, userID]) => userID === ctx.newUser.id);
				const role = guild.roles.cache.get(roleID);
				if (!role.editable)
					continue;
				const avatarURL = ctx.newUser.displayAvatarURL({ format: "png", size: 512, dynamic: false });
				const color = await this.fetchColorFromImage(avatarURL);
				await role.setColor(color.vibrant, `Sync role color to ${ctx.newUser.tag}'s avatar`);
			}
		}
	}

	async fetchColorFromImage(url) {
		const imageBuffer = await got(url).buffer();
		const stuff = await vibrant.from(imageBuffer).getPalette();
		const palette = {
			vibrant: stuff.Vibrant.hex,
			lightVibrant: stuff.LightVibrant.hex,
			darkVibrant: stuff.DarkVibrant.hex,
			muted: stuff.Muted.hex,
			lightMuted: stuff.LightMuted.hex,
			darkMuted: stuff.DarkMuted.hex
		};
		return palette;
	}
};