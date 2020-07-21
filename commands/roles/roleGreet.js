const BaseCommand = require("../../src/base/baseCommand.js");

module.exports = class RoleGreet extends BaseCommand {
	constructor(client) {
		super(client, {
			name: "rolegreet",
			aliases: ["rg"],
			group: "roles",
			description: [
				"Greet the user when they are given a specific role. Available placeholders are: ",
				[
					"%servername%",
					"%serverid%",
					"%servermembercount%",
					"%servermembercountordinal%",
					"%channelname%",
					"%channelmention%",
					"%channelid%",
					"%username%",
					"%usertag%",
					"%usermention%",
					"%rolename%",
					"%roleid%",
					"%rolemention%",
					"%rolemembercount%",
					"%rolemembercountordinal%"
				].map(p => `\`${p}\``).join(", ")
			].join("\n"),
			clientPermissions: ["SEND_MESSAGES", "EMBED_LINKS", "MANAGE_ROLES"],
			userPermissions: ["MANAGE_ROLES", "MANAGE_GUILD"],
			guildOnly: true,
			args: [
				{
					key: "action",
					prompt: "Set, remove or list the roles to greet for",
					type: "string",
					oneOf: ["set", "remove", "list"],
					default: "list"
				},
				{
					key: "role",
					prompt: "Role to greet for",
					type: "role",
					default: ""
				},
				{
					key: "channel",
					prompt: "Channel to greet in",
					type: "text-channel",
					default: ""
				},
				{
					key: "message",
					prompt: "Message to greet with",
					type: "string",
					default: "",
					validate: val => val.length < 512
				}
			]
		});
	}

	async task(ctx) {
		const roleGreetings = ctx.guildStorage.get("roleGreetings") || ctx.guildStorage.set("roleGreetings", {});
		if (ctx.args.action === "set") {
			if (!ctx.args.role)
				return ctx.embed("No role specified.");
			if (!ctx.args.channel)
				return ctx.embed("No channel specified.");
			if (!ctx.args.message)
				return ctx.embed("No message specified.");
			roleGreetings[ctx.args.role.id] = { channel: ctx.args.channel.id, message: ctx.args.message };
			ctx.guildStorage.set("roleGreetings", roleGreetings);
			return ctx.embed({
				title: `Role greeting set for ${ctx.args.role.name}!`,
				fields: [{
					name: `Message that will be sent in ${ctx.args.channel.name}:`,
					value: ctx.args.message
				}]
			});
		}
		else if (ctx.args.action === "remove") {
			if (!ctx.args.role)
				return ctx.embed("No role specified.");
			if (!Object.keys(roleGreetings).length || !Object.keys(roleGreetings).includes(ctx.args.role.id))
				return ctx.embed("No role greetings set.");
			delete roleGreetings[ctx.args.role.id];
			ctx.guildStorage.set("roleGreetings", roleGreetings);
			return ctx.embed(`Role greetings removed for ${ctx.args.role.name}.`);
		}
		else if (ctx.args.action === "list") {
			const greetings = Object.entries(roleGreetings);
			if (!greetings.length)
				return ctx.embed("No role greetings set.");
			const fields = greetings.map(([roleID, { channel, message }]) => ({
				name: ctx.guild.roles.cache.has(roleID) ? ctx.guild.roles.cache.get(roleID).name : roleID,
				value: [
					`**Channel:** ${ctx.guild.channels.cache.has(channel) ? ctx.guild.channels.cache.get(channel) : channel}`,
					`**Message:**\n ${message}`
				].join("\n"),
				inline: false
			}));
			return ctx.paginate(fields, {
				embedTemplate: {
					title: `Role greetings for ${ctx.guild.name}`,
					thumbnail: { url: ctx.guild.iconURL({ dynamic: true, size: 512, format: "png" }) }
				}
			});
		}
	}
};