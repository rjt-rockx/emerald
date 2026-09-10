const BaseCommand = require("../../src/base/baseCommand.js");

module.exports = class MemberCount extends BaseCommand {
	constructor(client) {
		super(client, {
			name: "membercount",
			group: "utils",
			aliases: ["mcount"],
			description: "Get the member count of the server.",
			clientPermissions: ["SEND_MESSAGES", "EMBED_LINKS"]
		});
	}

	async task(ctx) {
		await ctx.guild.members.fetch();
		const { memberCount: total, members } = ctx.guild;
		const [bots, users] = members.cache.partition(m => m.user.bot);
		ctx.embed({
			title: "Member count",
			description: [
				`Of ${total} members in ${ctx.guild.name}:`,
				`${users.size} are users`,
				`${bots.size} are bots`
			].join("\n"),
			thumbnail: { url: ctx.guild.iconURL({ format: "png", dynamic: true, size: 1024 }) }
		});
	}
};
