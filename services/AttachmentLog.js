const { MessageAttachment, MessageEmbed } = require("discord.js");
const BaseService = require("../src/base/baseService.js");
const { properRoundToTwo } = require("../src/utilites.js");

module.exports = class AttachmentLog extends BaseService {
	constructor(client) {
		super(client, {
			name: "Attachment Logging Service",
			description: "Fetches and reuploads attachments sent in the server to a particular channel.",
			enabled: true
		});
	}

	async onMessage(ctx) {
		if (!ctx.guild) return;
		const logChannel = ctx.guildStorage.get("attachmentLogChannel");
		if (!logChannel) return;
		if (ctx.guild && ctx.guild.channels.cache.has(logChannel) && ctx.message.attachments.size > 0 && !ctx.user.bot) {
			const attachments = [...ctx.message.attachments.values()];
			const reuploadable = attachments.filter(attachment => attachment.size <= 1024 * 1024 * 8).map(file => new MessageAttachment(file.url, file.name || "unknown"));
			const attachmentLinks = attachments.map(attachment => `[${attachment.name || "unknown"} (${properRoundToTwo(attachment.size / (1024 * 1024))} MB)](${attachment.url})`).join("\n");
			await ctx.guild.channels.cache.get(logChannel).send({
				embed: new MessageEmbed({
					author: {
						icon_url: ctx.user.displayAvatarURL({ format: "png", size: 1024, dynamic: true }),
						name: `${ctx.user.tag} sent ${attachments.length} attachment${attachments.length > 1 ? "s" : ""}.`
					},
					...(ctx.message.cleanContent ? { title: "Message", description: ctx.message.cleanContent } : {}),
					fields: [
						{
							name: "Original Attachment Links",
							value: attachmentLinks || "No attachment links could be parsed.",
							inline: false
						},
						{
							name: "User ID",
							value: ctx.user.id,
							inline: true
						},
						{
							name: "Message ID",
							value: `${ctx.message.id} | [[Link]](https://discordapp.com/channels/${ctx.guild.id}/${ctx.channel.id}/${ctx.message.id})`,
							inline: true
						}
					],
					footer: {
						text: `#${ctx.channel.name}`
					},
					timestamp: ctx.message.createdTimestamp
				}),
				files: reuploadable
			});
		}
	}
};
