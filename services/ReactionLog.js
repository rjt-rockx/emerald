const { MessageEmbed } = require("discord.js");
const BaseService = require("../src/base/baseService.js");

// Latest Twemoji licensed by Twitter under CC-BY 4.0

module.exports = class ReactionLog extends BaseService {
	constructor(client) {
		super(client, {
			name: "Reaction Log Service",
			description: "Logs reactions added to messages.",
			enabled: true,
			fetchPartials: true
		});
	}

	resolveURL(emoji, dynamic = false) {
		if (emoji.id) {
			if (emoji.animated && dynamic)
				return `https://cdn.discordapp.com/emojis/${emoji.id}.gif`;
			return `https://cdn.discordapp.com/emojis/${emoji.id}.png`;
		}
		return `https://twemoji.maxcdn.com/v/latest/72x72/${this.getIconID(emoji.name)}.png`;
	}

	getIconID(name) {
		return this.toCodePoint(name.indexOf(String.fromCharCode(0x200D)) < 0 ? name.replace(/\uFE0F/g, "") : name);
	}

	toCodePoint(unicodeSurrogates, sep) {
		const r = [];
		let c = 0,
			p = 0,
			i = 0;
		while (i < unicodeSurrogates.length) {
			c = unicodeSurrogates.charCodeAt(i++);
			if (p) {
				r.push((0x10000 + ((p - 0xD800) << 10) + (c - 0xDC00)).toString(16));
				p = 0;
			}
			else if (0xD800 <= c && c <= 0xDBFF) { p = c; }
			else { r.push(c.toString(16)); }
		}
		return r.join(sep || "-");
	}

	async onMessageReactionAdd(ctx) {
		if (!ctx || ctx.user.bot || !ctx.user || !ctx.reaction || ctx.reaction.message.author.bot) return;
		await ctx.fetchPartials();

		let errorReported = false;
		const errors = () => errorReported = true;
		if (ctx.reaction.partial) await ctx.reaction.fetch().catch(errors);
		if (ctx.reaction.message.partial) await ctx.reaction.message.fetch().catch(errors);
		if (ctx.reaction.message.channel.partial) await ctx.reaction.message.channel.fetch().catch(errors);
		if (errorReported) return;

		const logChannel = ctx.guildStorage.get("reactionLogChannel");
		if (!logChannel) return;
		const url = this.resolveURL(ctx.reaction.emoji);
		if (this.client.channels.cache.has(logChannel)) {
			this.client.channels.cache.get(logChannel).send(new MessageEmbed({
				author: {
					icon_url: ctx.user.displayAvatarURL({ format: "png", dynamic: true, size: 1024 }),
					name: `${ctx.user.tag} reacted in #${ctx.reaction.message.channel.name}`
				},
				thumbnail: { url },
				title: "Message",
				description: ctx.reaction.message.content || "[Embed]",
				fields: [
					{
						name: "Emoji",
						value: [
							ctx.reaction.emoji.id ? `:${ctx.reaction.emoji.name}:` : ctx.reaction.emoji.name,
							ctx.reaction.emoji.id ? `(${ctx.reaction.emoji.id})` : "",
							`| [[Link]](${url})`
						].join(" "),
						inline: false
					},
					{
						name: "User ID",
						value: ctx.user.id,
						inline: true
					},
					{
						name: "Message ID",
						value: `${ctx.reaction.message.id} | [[Link]](https://discordapp.com/channels/${ctx.guild.id}/${ctx.channel.id}/${ctx.message.id})`,
						inline: true
					}
				],
				footer: {
					icon_url: ctx.reaction.message.author.displayAvatarURL({ format: "png", size: 1024, dynamic: true }),
					text: `${ctx.reaction.message.author.tag} in #${ctx.reaction.message.channel.name}`
				},
				timestamp: ctx.reaction.message.createdTimestamp
			}));
		}
	}

	async onMessageReactionRemove(ctx) {
		if (!ctx || !ctx.user || ctx.user.bot || !ctx.reaction || ctx.reaction.message.author.bot) return;

		let errorReported = false;
		const errors = () => errorReported = true;
		if (ctx.reaction.partial) await ctx.reaction.fetch().catch(errors);
		if (ctx.reaction.message.partial) await ctx.reaction.message.fetch().catch(errors);
		if (ctx.reaction.message.channel.partial) await ctx.reaction.message.channel.fetch().catch(errors);
		if (errorReported) return;

		const logChannel = ctx.guildStorage.get("reactionLogChannel");
		if (!logChannel) return;
		const url = this.resolveURL(ctx.reaction.emoji);
		if (this.client.channels.cache.has(logChannel)) {
			this.client.channels.cache.get(logChannel).send(new MessageEmbed({
				author: {
					icon_url: ctx.user.displayAvatarURL({ format: "png", dynamic: true, size: 1024 }),
					name: `${ctx.user.tag}'s reaction was removed in #${ctx.reaction.message.channel.name}`
				},
				thumbnail: { url },
				description: ctx.reaction.message.content || "[Embed]",
				fields: [
					{
						name: "Emoji",
						value: [
							ctx.reaction.emoji.id ? `:${ctx.reaction.emoji.name}:` : ctx.reaction.emoji.name,
							ctx.reaction.emoji.id ? `(${ctx.reaction.emoji.id})` : "",
							`| [[Link]](${url})`
						].join(" "),
						inline: false
					},
					{
						name: "User ID",
						value: ctx.user.id,
						inline: true
					},
					{
						name: "Message ID",
						value: `${ctx.reaction.message.id} | [[Link]](https://discordapp.com/channels/${ctx.guild.id}/${ctx.channel.id}/${ctx.message.id})`,
						inline: true
					}
				],
				footer: {
					icon_url: ctx.reaction.message.author.displayAvatarURL({ format: "png", dynamic: true, size: 1024 }),
					text: `${ctx.reaction.message.author.tag} in #${ctx.reaction.message.channel.name}`
				}, timestamp: ctx.reaction.message.createdTimestamp
			}));
		}
	}

	async onMessageReactionRemoveEmoji(ctx) {
		if (!ctx || !ctx.reaction || ctx.reaction.message.author.bot) return;

		let errorReported = false;
		const errors = () => errorReported = true;
		if (ctx.reaction.partial) await ctx.reaction.fetch().catch(errors);
		if (ctx.reaction.message.partial) await ctx.reaction.message.fetch().catch(errors);
		if (ctx.reaction.message.channel.partial) await ctx.reaction.message.channel.fetch().catch(errors);
		if (errorReported) return;

		const logChannel = ctx.guildStorage.get("reactionLogChannel");
		if (!logChannel) return;
		const url = this.resolveURL(ctx.reaction.emoji);
		if (this.client.channels.cache.has(logChannel)) {
			this.client.channels.cache.get(logChannel).send(new MessageEmbed({
				author: {
					name: `A reaction was removed in #${ctx.reaction.message.channel.name}`
				},
				thumbnail: { url },
				description: ctx.reaction.message.content || "[Embed]",
				fields: [
					{
						name: "Emoji",
						value: [
							ctx.reaction.emoji.id ? `:${ctx.reaction.emoji.name}:` : ctx.reaction.emoji.name,
							ctx.reaction.emoji.id ? `(${ctx.reaction.emoji.id})` : "",
							`| [[Link]](${url})`
						].join(" "),
						inline: false
					},
					{
						name: "Message ID",
						value: `${ctx.reaction.message.id} | [[Link]](https://discordapp.com/channels/${ctx.guild.id}/${ctx.channel.id}/${ctx.message.id})`,
						inline: true
					}
				],
				footer: {
					icon_url: ctx.reaction.message.author.displayAvatarURL({ format: "png", dynamic: true, size: 1024 }),
					text: `${ctx.reaction.message.author.tag} in #${ctx.reaction.message.channel.name}`
				}, timestamp: ctx.reaction.message.createdTimestamp
			}));
		}
	}
};