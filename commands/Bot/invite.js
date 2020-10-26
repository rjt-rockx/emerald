const BaseCommand = require("../../src/base/baseCommand.js");
const pkg = require("../../package.json");

module.exports = class Invite extends BaseCommand {
	constructor(client) {
		super(client, {
			name: "invite",
			group: "bot",
			description: "Get an invite link to add the bot to your server.",
			clientPermissions: ["SEND_MESSAGES", "EMBED_LINKS"]
		});
	}

	async task(ctx) {
		return ctx.embed({
			title: `${ctx.client.user.username} v${pkg.version}`,
			description: `Use the following links to invite ${ctx.client.user.username} to your server.`,
			thumbnail: { url: ctx.client.user.displayAvatarURL({ size: 1024 }) },
			fields: [
				{
					name: "Default (Admin privileges)",
					value: await ctx.client.generateInvite({ permissions: "ADMINISTRATOR" }),
					inline: false
				},
				{
					name: "Non-Admin privileges",
					value: await ctx.client.generateInvite({
						permissions: [
							"MANAGE_GUILD",
							"MANAGE_CHANNELS",
							"MANAGE_ROLES",
							"MANAGE_MESSAGES",
							"VIEW_AUDIT_LOG",
							"VIEW_CHANNEL",
							"READ_MESSAGE_HISTORY",
							"SEND_MESSAGES",
							"ATTACH_FILES",
							"EMBED_LINKS",
							"ADD_REACTIONS",
							"USE_EXTERNAL_EMOJIS",
							"MOVE_MEMBERS"
						]
					}),
					inline: false
				},
				{
					name: "No privileges",
					value: await ctx.client.generateInvite(),
					inline: false
				}
			],
			footer: { text: `Bot ID: ${ctx.client.user.id}` }
		});
	}
};