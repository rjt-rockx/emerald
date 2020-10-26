const BaseCommand = require("../../src/base/baseCommand.js");
const { Util: { resolveColor } } = require("discord.js");

module.exports = class RoleGreetAutoDelete extends BaseCommand {
	constructor(client) {
		super(client, {
			name: "rolegreetautodelete",
			aliases: ["rgad"],
			group: "roles",
			description: "Automatically delete a particular role's greeting message",
			clientPermissions: ["SEND_MESSAGES", "EMBED_LINKS", "MANAGE_ROLES"],
			userPermissions: ["MANAGE_ROLES", "MANAGE_GUILD"],
			guildOnly: true,
			args: [
				{
					key: "role",
					prompt: "Role whose greeting is to be edited",
					type: "role"
				},
				{
					key: "seconds",
					prompt: "Seconds after which the message is to be deleted",
					type: "integer",
					default: 0,
					validate: value => value >= 0 && value <= 300
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
		if (ctx.args.seconds === 0) {
			delete roleGreetings[ctx.args.role.id].timeout;
			ctx.guildStorage.set("roleGreetings", roleGreetings);
			return ctx.embed("Role greeting timeout successfully removed.");
		}
		roleGreetings[ctx.args.role.id].timeout = ctx.args.seconds;
		ctx.guildStorage.set("roleGreetings", roleGreetings);
		return ctx.embed(`Role greeting timeout successfully set to ${ctx.args.seconds}s.`);
	}
};