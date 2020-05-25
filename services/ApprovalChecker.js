
const { MessageEmbed } = require("discord.js");
const BaseService = require("../src/base/baseService.js");
const { DiscordColors, properRoundToTwo } = require("../src/utilities/utilities.js");
const StorageWrapper = require("../src/utilities/googleCloudStorageWrapper.js");
const config = require("../config.js");
const isStorageSupported = Object.keys(config).includes("storage") && config.storage.enabled
	&& ["absolutePathToKeyfile", "bucketName"].every(key => Object.keys(config.storage).includes(key));

module.exports = class ApprovalChecker extends BaseService {
	constructor(client) {
		super(client, {
			name: "Approval Checker Service",
			description: "Reacts on messages sent in the approval channel, and listens for reactions to approve or deny an application.",
			enabled: isStorageSupported
		});
		if (isStorageSupported)
			this.storage = new StorageWrapper(config.storage);
	}

	async onMessageReactionAdd(ctx) {
		if (!ctx.guild) return;

		const approverRole = ctx.guildStorage.get("approverRole");
		if (!approverRole || !ctx.guild.roles.cache.has(approverRole) || !ctx.member.roles.cache.has(approverRole)) return;

		const applicationChannel = ctx.guildStorage.get("applicationChannel");
		if (!applicationChannel || !ctx.guild.channels.cache.has(applicationChannel)) return;
		if (ctx.channel.id !== applicationChannel) return;

		const archiveChannel = ctx.guildStorage.get("archiveChannel");
		if (!archiveChannel || !ctx.guild.channels.cache.has(archiveChannel)) return;

		const requiredPermissions = ["SEND_MESSAGES", "ATTACH_FILES", "EMBED_LINKS", "ADD_REACTIONS"];
		if (!ctx.guild.channels.cache.get(archiveChannel).memberPermissions(ctx.client.user).has(requiredPermissions)) return;

		if (!["✅", "❌"].includes(ctx.reaction.emoji.toString())) return;

		const attachmentFields = [], uploadedAttachments = [];

		if (isStorageSupported) {
			for (const [attachmentId, attachment] of ctx.message.attachments) {
				if (attachment) {
					const { url } = await this.storage.uploadAttachment(attachment);
					uploadedAttachments.push({ name: attachment.name || "unknown", size: attachment.size, url });
				}
			}

			if (uploadedAttachments.length > 0) {
				let currentField = 0, totalText = "";
				const links = uploadedAttachments.map(({ name, size, url }) => `[${name.length >= 30 ? name.substring(0, 27) + "..." : name} (${properRoundToTwo(size / (1024 * 1024))} MB)](${url})`);
				for (const link of links) {
					if ((totalText + link + "\n").length <= 1024)
						totalText += link + "\n";
					if ((totalText + link + "\n").length > 1024) {
						attachmentFields.push({
							name: `Attachments${currentField > 0 ? " (contd.)" : ""}`,
							value: totalText
						});
						currentField += 1;
						totalText = "";
					}
				}
				if (totalText)
					attachmentFields.push({
						name: `Attachments${currentField > 0 ? " (contd.)" : ""}`,
						value: totalText
					});
			}
		}

		await ctx.message.delete();

		await ctx.message.author.send(new MessageEmbed({
			thumbnail: { url: ctx.user.displayAvatarURL({ format: "png", size: 1024, dynamic: true }) },
			author: { name: `Your application was ${ctx.reaction.emoji.toString() === "✅" ? "approved" : "denied"}!` },
			title: "Message Content",
			description: ctx.message.cleanContent || "[No message content]",
			fields: [
				{
					name: `${ctx.reaction.emoji.toString() === "✅" ? "Approved" : "Denied"} by`,
					value: ctx.user.toString()
				},
				...attachmentFields
			],
			color: ctx.reaction.emoji.toString() === "✅" ? DiscordColors.GREEN : DiscordColors.RED
		}));

		ctx.guild.channels.cache.get(archiveChannel).send(new MessageEmbed({
			thumbnail: { url: ctx.message.author.displayAvatarURL({ format: "png", size: 1024, dynamic: true }) },
			author: { name: `Application successfully ${ctx.reaction.emoji.toString() === "✅" ? "approved" : "denied"}.` },
			title: "Message Content",
			description: ctx.message.cleanContent || "[No message content]",
			fields: [
				{
					name: `${ctx.reaction.emoji.toString() === "✅" ? "Approved" : "Denied"} by`,
					value: ctx.user.toString()
				},
				...attachmentFields
			],
			color: ctx.reaction.emoji.toString() === "✅" ? DiscordColors.GREEN : DiscordColors.RED
		}));
	}

	async onMessage(ctx) {
		if (!ctx.guild || ctx.user.bot) return;

		const approverRole = ctx.guildStorage.get("approverRole");
		if (!approverRole || !ctx.guild.roles.cache.has(approverRole)) return;

		const archiveChannel = ctx.guildStorage.get("archiveChannel");
		if (!archiveChannel || !ctx.guild.channels.cache.has(archiveChannel)) return;

		const applicationChannel = ctx.guildStorage.get("applicationChannel");
		if (!applicationChannel || !ctx.guild.channels.cache.has(applicationChannel)) return;
		if (ctx.channel.id !== applicationChannel) return;

		const requiredPermissions = ["SEND_MESSAGES", "ATTACH_FILES", "EMBED_LINKS", "ADD_REACTIONS"];
		if (!ctx.guild.channels.cache.get(applicationChannel).memberPermissions(this.client.user).has(requiredPermissions)) return;

		await ctx.message.react("✅").catch(() => { });
		await ctx.message.react("❌").catch(() => { });
	}
};