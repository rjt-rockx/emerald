const BaseService = require("../src/base/baseService.js");

module.exports = class RoleGreet extends BaseService {
	constructor(client) {
		super(client, {
			name: "Role Greet Service",
			description: "Greet a user when they get a specific role.",
			enabled: true,
			guildOnly: true,
			fetchPartials: true
		});
	}

	getOrdinal(num) {
		const snum = `${num}`;
		if (snum.endsWith("1") && !snum.endsWith("11"))
			return "st";
		if (snum.endsWith("2") && !snum.endsWith("12"))
			return "nd";
		if (snum.endsWith("3") && !snum.endsWith("13"))
			return "rd";
		return "th";
	}

	replacePlaceholders(ctx, channel, role, message) {
		let replacedMessage = message;
		const toReplace = [
			["%servername%", ctx.guild.name],
			["%serverid%", ctx.guild.id],
			["%servermembercount%", ctx.guild.members.cache.size],
			["%servermembercountordinal%", this.getOrdinal(ctx.guild.members.cache.size)],
			["%channelname%", channel.name],
			["%channelmention%", channel.toString()],
			["%channelid%", channel.id],
			["%username%", ctx.user.name],
			["%usertag%", ctx.user.tag],
			["%usermention%", ctx.user.toString()],
			["%rolename%", role.name],
			["%roleid%", role.id],
			["%rolemention%", role.toString()],
			["%rolemembercount%", role.members.size],
			["%rolemembercountordinal%", this.getOrdinal(role.members.size)]
		];
		for (const [placeholder, value] of toReplace)
			replacedMessage = replacedMessage.replace(new RegExp(placeholder, "g"), value);
		return replacedMessage;
	}

	async sendGreeting(ctx, channel, role, message) {
		const replacedMessage = this.replacePlaceholders(ctx, channel, role, message);
		return channel.send(replacedMessage);
	}

	async onGuildMemberUpdate(ctx) {
		if (!ctx.changes || !Object.keys(ctx.changes).length || !Object.keys(ctx.changes).includes("roles"))
			return;
		const roleGreetings = ctx.guildStorage.get("roleGreetings");
		if (!roleGreetings || !Object.keys(roleGreetings).length)
			return;
		for (const [roleID, greeting] of Object.entries(roleGreetings)) {
			if (!ctx.guild.roles.cache.has(roleID))
				continue;
			const role = ctx.guild.roles.cache.get(roleID);
			const roleChanges = ctx.changes.roles;
			if (!roleChanges.old.cache.has(roleID) && roleChanges.new.cache.has(roleID)) {
				const channel = ctx.guild.channels.cache.get(greeting.channel);
				if (!channel) continue;
				this.sendGreeting(ctx, channel, role, greeting.message);
			}
		}
	}
};