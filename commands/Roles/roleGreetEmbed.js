const BaseCommand = require("../../src/base/baseCommand.js");
const { Util: { resolveColor } } = require("discord.js");

module.exports = class RoleGreetEmbed extends BaseCommand {
	constructor(client) {
		super(client, {
			name: "rolegreetembed",
			aliases: ["rge"],
			group: "roles",
			description: "Edit embed options for a particular role's greeting message",
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
					key: "type",
					prompt: "Send the greeting as either plaintext or as an embed",
					type: "string",
					oneOf: ["plaintext", "embed"]
				},
				{
					key: "color",
					prompt: "Hex color of the embed",
					type: "string",
					default: ""
				},
				{
					key: "image",
					prompt: "Direct link to the embed image",
					type: "string",
					default: ""
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
		const greeting = roleGreetings[ctx.args.role.id];
		if (ctx.args.type === "plaintext") {
			delete greeting.embed;
			roleGreetings[ctx.args.role.id] = greeting;
			ctx.guildStorage.set("roleGreetings", roleGreetings);
			return ctx.embed("Role greeting set to plaintext.");
		}
		else if (ctx.args.type === "embed") {
			greeting.embed = {};
			if (typeof ctx.args.color === "string" && ctx.args.color.length) {
				greeting.color = ctx.args.color;
			}
			if (typeof ctx.args.image === "string" && ctx.args.image.length) {
				greeting.image = ctx.args.image;
			}
			ctx.guildStorage.set("roleGreetings", roleGreetings);
			return ctx.embed("Role greeting set to embed.");
		}
	}
};