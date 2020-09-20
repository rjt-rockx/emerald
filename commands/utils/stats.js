const BaseCommand = require("../../src/base/baseCommand.js");
const pkg = require("../../package.json");
const { toTitleCase, getDuration } = require("../../src/utilities/utilities.js");

module.exports = class Stats extends BaseCommand {
	constructor(client) {
		super(client, {
			name: "stats",
			group: "utils",
			description: "Get the current stats of the bot.",
			clientPermissions: ["SEND_MESSAGES", "EMBED_LINKS"]
		});
	}

	async task(ctx) {
		return ctx.embed({
			title: `${ctx.client.user.username} v${pkg.version}`,
			description: pkg.description || "No description specified",
			thumbnail: { url: ctx.client.user.displayAvatarURL({ size: 512 }) },
			fields: [
				{
					name: "Usage",
					value: [
						`Use \`${ctx.prefix}help\` to view a list of all commands.`,
						`Use \`${ctx.prefix}help [command name]\` to view help for that specific command.`
					]
				},
				{
					name: "Counts",
					value: [
						ctx.client.guilds.cache.size + " servers",
						ctx.client.channels.cache.size + " channels",
						ctx.client.users.cache.size + " users"
					].join("\n"),
					inline: true
				},
				... (ctx.client.owners ? [{
					name: "Owners",
					value: ctx.client.owners.map(u => u.tag).join("\n"),
					inline: true
				}] : []),
				{
					name: "Memory / Uptime",
					value: Math.floor(process.memoryUsage().heapUsed / 1024 / 1024) + "MB /" + getDuration(ctx.client.uptime),
					inline: true
				},
				{
					name: "Useful links",
					value: Object.entries({
						invite: await ctx.client.generateInvite({ permissions: "ADMINISTRATOR" }),
						homepage: pkg.homepage || "",
						issues: pkg.bugs.url || ""
					}).reduce((acc, [k, v]) => v ? acc.push(`[${toTitleCase(k)}](${v})`) && acc : acc, []).join(" | ")
				}
			],
			footer: { text: `Bot ID: ${ctx.client.user.id}` }
		});
	}
};