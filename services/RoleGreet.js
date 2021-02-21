const BaseService = require("../src/base/baseService.js");
const { sleep, grammarCombine } = require("../src/utilities/utilities.js");

module.exports = class RoleGreet extends BaseService {
	constructor(client) {
		super(client, {
			name: "Role Greet Service",
			description: "Greet a user when they get a specific role.",
			enabled: true,
			guildOnly: true,
			fetchPartials: true
		});
		this.greetings = {};
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

	replacePlaceholders(ctx, role, { channel, message }, users) {
		let replacedMessage = message;
		const toReplace = [
			["%servername%", ctx.guild.name],
			["%serverid%", ctx.guild.id],
			["%servermembercount%", ctx.guild.members.cache.size],
			["%servermembercountordinal%", this.getOrdinal(ctx.guild.members.cache.size)],
			["%channelname%", channel.name],
			["%channelmention%", channel.toString()],
			["%channelid%", channel.id],
			["%username%", grammarCombine(users.map(user => user.name))],
			["%usertag%", grammarCombine(users.map(user => user.tag))],
			["%usermention%", grammarCombine(users.map(user => user.toString()))],
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

	async sendGreeting(ctx, role, greeting) {
		let users = [ctx.user];
		let message;
		if (this.greetings[role.id] && Array.isArray(this.greetings[role.id].users) && this.greetings[role.id].users.length < 10) {
			users = [...this.greetings[role.id].users, ctx.user]
				.filter((user, _, users) => users.map(u => u.id).indexOf(user.id) === users.map(u => u.id).lastIndexOf(user.id));
			message = this.greetings[role.id].message;
			clearTimeout(this.greetings[role.id].timeout);
		}
		let messageContent = this.replacePlaceholders(ctx, role, greeting, users);
		if (greeting.embed) {
			const embedProperties = {};
			if (greeting.color)
				embedProperties.color = greeting.color;
			if (greeting.image)
				embedProperties.image = { url: greeting.image };
			messageContent = { embed: { description: messageContent, ...embedProperties } };
		}
		message = message ? message.then(m => m.edit(messageContent)) : greeting.channel.send(messageContent);
		if (greeting.timeout && !greeting.multiple)
			return message.then(m => sleep(+greeting.timeout * 1000).then(() => m.delete()));
		if (greeting.multiple) {
			this.greetings[role.id] = { message, users };
			if (greeting.timeout)
				this.greetings[role.id].timeout = setTimeout(() =>
					this.greetings[role.id].message
						.then(m => {
							delete this.greetings[role.id];
							return m;
						})
						.then(m => m.delete()), +greeting.timeout * 1000);
		}
		return message;
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
				this.sendGreeting(ctx, role, { ...greeting, channel });
			}
		}
	}
};