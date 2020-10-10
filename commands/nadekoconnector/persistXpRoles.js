const BaseCommand = require("../../src/base/baseCommand.js");

module.exports = class PersistXpRoles extends BaseCommand {
	constructor(client) {
		super(client, {
			name: "ncpersistxproles",
			description: "Persists the XP role rewards set for this server.",
			group: "nadekoconnector",
			userPermissions: ["ADMINISTRATOR"],
			clientPermissions: ["ADMINISTRATOR"],
			args: [
				{
					key: "enabled",
					prompt: "Enable or disable XP role reward persistence for this server.",
					type: "string",
					oneOf: ["enable", "disable"],
					default: "enable"
				}
			]
		});
	}

	async task(ctx) {
		ctx.guildStorage.set("ncpersistxprolerews", ctx.args.enabled === "enable");
		ctx.services.ncrolerewards.syncRolerewards(ctx);
		return ctx.embed(`XP role reward persistence for this server successfully ${ctx.args.enabled + "d"}.`);
	}
};