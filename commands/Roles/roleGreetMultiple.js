const BaseCommand = require("../../src/base/baseCommand.js");

module.exports = class RoleGreetMultiple extends BaseCommand {
	constructor(client) {
		super(client, {
			name: "rolegreetmultiple",
			aliases: ["rgm"],
			group: "roles",
			description: "Combine multiple greeting messages of the same role together",
			clientPermissions: ["SEND_MESSAGES", "EMBED_LINKS", "MANAGE_ROLES"],
			userPermissions: ["MANAGE_ROLES", "MANAGE_GUILD"],
			guildOnly: true,
			args: [
				{
					key: "role",
					prompt: "Role whose greeting is to be combined",
					type: "role"
				},
				{
					key: "enabled",
					prompt: "Whether to combine multiple greetings of the same role",
					type: "boolean",
					default: true
				}
			]
		});
	}

	async task(ctx) {
		const roleGreetings = ctx.guildStorage.get("roleGreetings") || ctx.guildStorage.set("roleGreetings", {});
		if (!Object.keys(roleGreetings).length)
			return ctx.embed("No role greetings found.");
		if (!Object.keys(roleGreetings).includes(ctx.args.role.id))
			return ctx.embed("Role greeting not set.");
		if (!ctx.args.enabled) {
			delete roleGreetings[ctx.args.role.id].multiple;
			ctx.guildStorage.set("roleGreetings", roleGreetings);
			return ctx.embed("Role greetings will now send individual messages for each user.");
		}
		roleGreetings[ctx.args.role.id].multiple = ctx.args.enabled;
		ctx.guildStorage.set("roleGreetings", roleGreetings);
		return ctx.embed("Role greetings will be combined for multiple users being given the same role.");
	}
};