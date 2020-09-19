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
		const counts = {
			total,
			users: users.size, bots: bots.size,
			online: users.filter(m => m.presence.status === "online").size,
			idle: users.filter(m => m.presence.status === "idle").size,
			offline: users.filter(m => m.presence.status === "offline").size,
			dnd: users.filter(m => m.presence.status === "dnd").size,
			mobile: users.filter(m => {
				if (!(m.presence.clientStatus instanceof Object)) return false;
				return Object.keys(m.presence.clientStatus).length < 2 && Object.keys(m.presence.clientStatus).includes("mobile");
			}).size,
			mobileDesktop: users.filter(m => {
				if (!(m.presence.clientStatus instanceof Object)) return false;
				return Object.keys(m.presence.clientStatus).length > 1 && Object.keys(m.presence.clientStatus).includes("mobile");
			}).size,
			open: users.filter(m => m.presence.status !== "offline").size
		};
		counts.desktop = counts.open - (counts.mobile + counts.mobileDesktop);
		const fields = [
			{
				name: `Of ${total} members in ${ctx.guild.name},`,
				value: [
					`${counts.users} are users`,
					`${counts.bots} are bots`
				].join("\n")
			},
			{
				name: `Going by status, of ${counts.users} users,`,
				value: [
					`${counts.online} are online`,
					`${counts.idle} are idle/AFK`,
					`${counts.dnd} are on do-not-disturb`,
					`${counts.offline} are either invisible or offline.`
				].join("\n")
			},
			{
				name: `Going by devices, of ${counts.open} users who have Discord open,`,
				value: [
					`${counts.desktop} are on their desktop/on the web`,
					`${counts.mobile} are on their mobile`,
					`${counts.mobileDesktop} are on both mobile and desktop/web`
				].join("\n")
			}
		];
		ctx.embed({
			title: "Member count",
			description: fields.map(f => `**${f.name}**\n${f.value}`).join("\n\n"),
			thumbnail: { url: ctx.guild.iconURL({ format: "png", dynamic: true, size: 1024 }) }
		});
	}
};