const BaseCommand = require("../../src/base/baseCommand.js");

module.exports = class SyncRoleColor extends BaseCommand {
	constructor(client) {
		super(client, {
			name: "syncrolecolor",
			aliases: ["src"],
			group: "basic",
			description: "Sync a role color to a user's avatar.",
			clientPermissions: ["SEND_MESSAGES", "EMBED_LINKS", "MANAGE_ROLES"],
			userPermissions: ["MANAGE_ROLES", "MANAGE_GUILD"],
			args: [
				{
					key: "action",
					prompt: "Enable or disable role color syncing",
					type: "string",
					oneOf: ["enable", "disable"]
				},
				{
					key: "role",
					prompt: "Role to edit the color of",
					type: "role"
				},
				{
					key: "user",
					prompt: "User whose avatar to sync colors to",
					type: "user",
					default: ""
				}
			]
		});
	}

	async task(ctx) {
		const syncedRoles = ctx.guildStorage.get("syncedRoles") || ctx.guildStorage.set("syncedRoles", {});
		if (ctx.args.action === "enable") {
			if (!ctx.args.user)
				return ctx.embed("No user specified.");
			syncedRoles[ctx.args.role.id] = ctx.args.user.id;
			ctx.guildStorage.set("syncedRoles", syncedRoles);
			return ctx.embed(`Role color of ${ctx.args.role.name} will be synced to ${ctx.args.user}'s avatar from now on.`);
		}
		else if (ctx.args.action === "disable") {
			if (!Object.keys(syncedRoles).has(ctx.args.role.id))
				return ctx.embed(`No role color sync set for ${ctx.args.role.name}`);
			delete syncedRoles[ctx.args.role.id];
			ctx.guildStorage.set("syncedRoles", syncedRoles);
			return ctx.embed(`Role color of ${ctx.args.role.name} will no longer be synced from now on.`);
		}
	}
};