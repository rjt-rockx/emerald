const BaseService = require("../src/base/baseService.js");

module.exports = class XP extends BaseService {
	constructor(client) {
		super(client, {
			name: "XP Service",
			description: "Manage XP data for each guild.",
			enabled: true,
			guildOnly: true
		});
		this.guilds = {};
		this.defaultXpOptions = {
			messageConsidered: "first",
			minuteInterval: 1,
			maxCharCount: 256,
			globalMultiplier: 1,
			enabled: false
		};
		this.lastKnownChannel = {};
	}

	getOrInitializeGuild(ctx) {
		if (!this.guilds[ctx.guild.id])
			this.guilds[ctx.guild.id] = { xp: {}, counter: 0, guildStorage: ctx.guildStorage };
		const xpOptions = ctx.guildStorage.get("xpOptions") || ctx.guildStorage.set("xpOptions", {});
		this.guilds[ctx.guild.id].xpOptions = this.validateXpOptions(xpOptions) || this.defaultXpOptions;
		return this.guilds[ctx.guild.id];
	}

	updateXpOptions(id, xpOptions) {
		const validatedOptions = this.validateXpOptions(xpOptions);
		this.guilds[id].xpOptions = validatedOptions || this.defaultXpOptions;
		return validatedOptions;
	}

	validateXpOptions(xpOptions) {
		for (const key of Object.keys(xpOptions))
			if (typeof this.defaultXpOptions[key] !== typeof xpOptions[key] || !Object.keys(this.defaultXpOptions).includes(key))
				return;
		if (!["first", "longest", "average"].includes(xpOptions.messageConsidered))
			return;
		if (!Number.isSafeInteger(xpOptions.globalMultiplier) || xpOptions.globalMultiplier > 10 || xpOptions.globalMultiplier < 0)
			return;
		if (!Number.isSafeInteger(xpOptions.maxCharCount) || xpOptions.maxCharCount > 2000 || xpOptions.maxCharCount < 0)
			return;
		if (!Number.isSafeInteger(xpOptions.minuteInterval) || xpOptions.minuteInterval > 60 || xpOptions.minuteInterval < 1)
			return;
		return Object.keys(this.defaultXpOptions).reduce((key, obj) => { obj[key] = xpOptions[key]; return obj; }, this.defaultXpOptions);
	}

	onMessage(ctx) {
		if (ctx.user.bot || ctx.message.isCommand)
			return;
		const { xp, xpOptions } = this.getOrInitializeGuild(ctx);

		if (!xpOptions.enabled)
			return;

		const sanitizedText = this.sanitizeText(ctx.message.content);
		if (!sanitizedText || !sanitizedText.length)
			return;

		let characterCount = +sanitizedText.split(" ").join("").length;
		if (xpOptions.maxCharCount > 0 && xpOptions.maxCharCount <= 2000)
			characterCount = Math.min(characterCount, xpOptions.maxCharCount);

		if (typeof xp[ctx.user.id] === "number") {
			if (xpOptions.messageConsidered === "longest")
				xp[ctx.user.id] = Math.max(xp[ctx.user.id], characterCount);
			else if (xpOptions.messageConsidered === "average")
				xp[ctx.user.id] = parseInt((xp[ctx.user.id] + characterCount) / 2, 10);
			else if (xpOptions.messageConsidered === "first")
				return;
		}
		else if (typeof xp[ctx.user.id] !== "number")
			xp[ctx.user.id] = characterCount;

		this.setLastKnownChannelID(ctx.guild.id, ctx.user.id, ctx.channel.id);
	}

	getLastKnownChannelID(guildID, userID) {
		if (!this.lastKnownChannel[guildID])
			this.lastKnownChannel[guildID] = {};
		if (!this.lastKnownChannel[guildID][userID]) return;
		return this.lastKnownChannel[guildID][userID];
	}

	setLastKnownChannelID(guildID, userID, channelID) {
		if (!this.lastKnownChannel[guildID])
			this.lastKnownChannel[guildID] = {};
		this.lastKnownChannel[guildID][userID] = channelID;
		return this.lastKnownChannel;
	}

	everyMinute(ctx) {
		for (const id of Object.keys(this.guilds)) {
			const { xp, guildStorage, xpOptions } = this.guilds[id];
			if (!xpOptions.enabled)
				continue;

			this.guilds[id].counter++;
			if (this.guilds[id].counter !== +xpOptions.minuteInterval)
				continue;

			const xpData = guildStorage.get("xp") || guildStorage.set("xp", {});

			for (const [userID, xpToAdd] of Object.entries(xp)) {
				if (typeof xpData[userID] !== "number")
					xpData[userID] = 0;
				const oldXpInfo = this.getXPData(id, userID, xpData);
				xpData[userID] += xpToAdd * xpOptions.globalMultiplier;
				const newXpInfo = this.getXPData(id, userID, xpData);

				if (oldXpInfo.level !== newXpInfo.level) {
					const [user, guild] = [this.client.users.cache.get(userID), this.client.guilds.cache.get(id)];
					const channelID = this.getLastKnownChannelID(id, userID);
					const channel = guild.channels.cache.get(channelID);
					this.handler.runClientEvent("levelUp", [user, channel, guild, oldXpInfo, newXpInfo]);
				}
			}

			guildStorage.set("xp", xpData);
			this.guilds[id].xp = {};
			this.guilds[id].counter = 0;
		}
	}

	onLevelUp(ctx) {
		if (ctx.channel)
			return ctx.embed(`Congratulations ${ctx.user}, you've levelled up to level ${ctx.level}!`);
		else return ctx.dmEmbed(`Congratulations ${ctx.user}, you've levelled up to level ${ctx.level} in ${ctx.guild.name}!`);
	}

	sanitizeText(text) {
		const idRegex = /(?<mention><[@!&#]{1,2}?(?<id>\d{15,25})>|@everyone|@here)/g;
		const customEmojiRegex = /<(?<identifier>:(?<name>.*?):)(?<id>\d*?)>/gmi;
		const regularEmojiRegex = /(:)(?<name>[\w-]*?)(\1)/gmi;
		const formattingRegex = /(?<start>```|`|\*\*|\*|__|_|~~|\|\|)(?<content>.*?)(?<end>\1)/gmi;
		const gapRegex = /(?<gapChar>\s|\n)+/gmi;

		const filteredContent = String(text)
			.replace(idRegex, " ")
			.replace(customEmojiRegex, "#")
			.replace(regularEmojiRegex, "#")
			.replace(gapRegex, "$1");

		if (!filteredContent)
			return;

		let unformattedContent = filteredContent, regexResults = formattingRegex.exec(unformattedContent);
		while (regexResults && regexResults.groups) {
			unformattedContent = unformattedContent.replace(formattingRegex, "$2");
			regexResults = formattingRegex.exec(unformattedContent);
		}

		if (!unformattedContent)
			return;

		return unformattedContent;
	}

	calculateLevel(xp) {
		let level = 0, required = 0;
		let progress = typeof xp === "number" ? xp : 0;
		const total = progress;
		while (required <= progress) {
			++level;
			progress = progress - required;
			required = Math.ceil((level ** 2) / 2) * 100;
		}
		return { level: level - 1, progress, required, total };
	}

	getXPData(guildID, userID = "", xpData) {
		const guildStorage = this.client.dataHandler.getGuildStorage(guildID);
		const parsedXpData = xpData || guildStorage.get("xp") || guildStorage.set("xp", {});
		const guildXpData = Object.entries(parsedXpData).sort((a, b) => b[1] - a[1]).reduce((guildXpData, [id, totalXp], index, { length: totalRanks }) => {
			guildXpData[id] = { ...this.calculateLevel(totalXp), rank: +index + 1, totalRanks };
			return guildXpData;
		}, {});
		return userID ? guildXpData[userID] : guildXpData;
	}
};