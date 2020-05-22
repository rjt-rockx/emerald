const { MessageEmbed } = require("discord.js");
const logger = require("./utilities/logger.js");
const paginator = require("./utilities/paginator.js");
const dataHandler = require("./handlers/dataHandler.js");

const camelCase = data => data.replace(/(_\w)/g, text => text[1].toUpperCase());
const camelCaseKeys = data => {
	const newData = {};
	for (const property in data) {
		if (Object.hasOwnProperty.apply(data, property))
			newData[camelCase(property)] = data[property];
	}
	return newData;
};

class ContextGenerator {
	async initialize(client) {
		this.client = client;
		this.client.context = this;
		this.defaultCtx = {
			client: this.client,
			globalStorage: dataHandler.getGlobalStorage(),
			logger, paginator
		};
		return this;
	}

	partialErrorHandler() { }

	get defaultContext() {
		const context = { ...this.defaultCtx };
		context.paginate = (...data) => new context.paginator(context, ...data);
		context.emittedAt = new Date();
		return context;
	}

	async fetchPartials(context) {
		const props = ["message", "newMessage", "channel", "newChannel", "oldChannel", "reaction", "oldMessage", "newMessage"];
		return Promise.all(props.map(prop => {
			if (prop in context && context[prop].partial)
				return context[prop].fetch().catch((...args) => this.partialErrorHandler(...args));
			return Promise.resolve(context[prop]);
		}));
	}

	getMessage(context) {
		if (context.reaction && context.reaction.message)
			context.message = context.reaction.message;
		if (context.newMessage)
			context.message = context.newMessage;
	}

	getUser(context) {
		if (!context.user) {
			if (context.member && context.member.user)
				context.user = context.member.user;
			if (context.newMember && context.newMember.user)
				context.user = context.newMember.user;
			if (context.message)
				context.user = context.message.author;
			if (context.newUser)
				context.user = context.newUser;
			if (context.invite && context.invite.inviter)
				context.user = context.invite.inviter;
		}
	}

	getMember(context) {
		if (!context.member) {
			if (context.newMember)
				context.member = context.newMember;
			if (context.guild && context.user && !context.member)
				if (context.guild.members.resolve(context.user.id))
					context.member = context.guild.members.resolve(context.user.id);
		}
	}

	getChannel(context) {
		if (context.message && context.message.channel)
			context.channel = context.message.channel;
		if (context.newChannel)
			context.channel = context.newChannel;
		if (context.messages)
			context.channel = context.messages.first().channel;
		if (context.invite && context.invite.channel)
			context.channel = context.invite.channel;
	}

	getGuild(context) {
		if (!context.guild) {
			if (context.channel && context.channel.guild)
				context.guild = context.channel.guild;
			if (context.emoji && context.emoji.guild)
				context.guild = context.emoji.guild;
			if (context.newEmoji && context.newEmoji.guild)
				context.guild = context.newEmoji.guild;
			if (context.member)
				context.guild = context.member.guild;
			if (context.newMember && context.newMember.guild)
				context.guild = context.newMember.guild;
			if (context.newGuild)
				context.guild = context.newGuild;
			if (context.role)
				context.guild = context.role.guild;
			if (context.invite)
				context.guild = context.invite.guild;
		}
		if (context.guild) {
			context.guildStorage = dataHandler.getGuildStorage(context.guild.id);
			context.botMember = context.guild.members.resolve(context.client.user.id);
		}
	}

	attachExtras(context) {
		if (context.message) {
			context.msg = context.message;
			context.react = (...data) => context.message.react(...data);
			context.code = (...data) => context.message.code(...data);
			context.send = (...data) => context.message.say(...data);
			context.say = (...data) => context.message.say(...data);
			context.edit = (...data) => context.message.edit(...data);
			context.reply = (...data) => context.message.reply(...data);
			context.replyEmbed = (...data) => context.message.replyEmbed(...data);
			context.embed = (...data) => context.message.embed(...data);
			if (context.message.command)
				context.command = context.message.command;
		}
		if (context.user) {
			context.dm = (...data) => context.user.send(...data);
			context.dmEmbed = data => data instanceof MessageEmbed ? context.dm(data) : context.dm(new MessageEmbed(data));
		}
		if (context.channel) {
			context.selfDestruct = (data, seconds = 10) => context.channel.send(data).then(msg => msg.delete({ timeout: seconds * 1000 }));
			context.selfDestructEmbed = (data, seconds = 10) => context.channel.send(new MessageEmbed(data)).then(msg => msg.delete({ timeout: seconds * 1000 }));
		}
		context.prefix = context.guild && context.guild.commandPrefix ? context.guild.commandPrefix : context.client.commandPrefix;
	}

	timedEvent() {
		return this.defaultContext;
	}

	raw(...args) {
		let context = this.defaultContext;
		const [{ data, type }] = args;
		if (data && type)
			context = {
				...context,
				data: camelCaseKeys(data),
				type: camelCase(type.toLowerCase())
			};
		return context;
	}

	async channelCreate(...args) {
		const context = this.defaultContext;
		[context.channel] = args;
		this.getGuild(context);
		this.attachExtras(context);
		await this.fetchPartials(context);
		return context;
	}

	async channelDelete(...args) {
		const context = this.defaultContext;
		[context.channel] = args;
		this.getGuild(context);
		this.attachExtras(context);
		await this.fetchPartials(context);
		return context;
	}

	async channelPinsUpdate(...args) {
		const context = this.defaultContext;
		[context.channel, context.time] = args;
		this.getGuild(context);
		this.attachExtras(context);
		await this.fetchPartials(context);
		return context;
	}

	async channelUpdate(...args) {
		const context = this.defaultContext;
		[context.oldChannel, context.newChannel] = args;
		this.getChannel(context);
		this.getGuild(context);
		this.attachExtras(context);
		await this.fetchPartials(context);
		return context;
	}

	debug(...args) {
		const context = this.defaultContext;
		[context.info] = args;
		return context;
	}

	warn(...args) {
		const context = this.defaultContext;
		[context.info] = args;
		return context;
	}

	async emojiCreate(...args) {
		const context = this.defaultContext;
		[context.emoji] = args;
		this.getGuild(context);
		this.attachExtras(context);
		await this.fetchPartials(context);
		return context;
	}

	async emojiDelete(...args) {
		const context = this.defaultContext;
		[context.emoji] = args;
		this.getGuild(context);
		this.attachExtras(context);
		await this.fetchPartials(context);
		return context;
	}

	async emojiUpdate(...args) {
		const context = this.defaultContext;
		[context.oldEmoji, context.newEmoji] = args;
		this.getGuild(context);
		this.attachExtras(context);
		await this.fetchPartials(context);
		return context;
	}

	async guildBanAdd(...args) {
		const context = this.defaultContext;
		[context.guild, context.user] = args;
		this.attachExtras(context);
		await this.fetchPartials(context);
		return context;
	}

	async guildBanRemove(...args) {
		const context = this.defaultContext;
		[context.guild, context.user] = args;
		this.attachExtras(context);
		await this.fetchPartials(context);
		return context;
	}

	async guildCreate(...args) {
		const context = this.defaultContext;
		[context.guild] = args;
		this.attachExtras(context);
		await this.fetchPartials(context);
		return context;
	}

	async guildDelete(...args) {
		const context = this.defaultContext;
		[context.guild] = args;
		this.attachExtras(context);
		await this.fetchPartials(context);
		return context;
	}

	async guildMemberAdd(...args) {
		const context = this.defaultContext;
		[context.member] = args;
		this.getUser(context);
		this.getGuild(context);
		this.attachExtras(context);
		await this.fetchPartials(context);
		return context;
	}

	async guildMemberRemove(...args) {
		const context = this.defaultContext;
		[context.member] = args;
		this.getUser(context);
		this.getGuild(context);
		this.attachExtras(context);
		await this.fetchPartials(context);
		return context;
	}

	async guildMemberUpdate(...args) {
		const context = this.defaultContext;
		[context.oldMember, context.newMember] = args;
		this.getUser(context);
		this.getGuild(context);
		this.getMember(context);
		this.attachExtras(context);
		await this.fetchPartials(context);
		return context;
	}

	async inviteCreate(...args) {
		const context = this.defaultContext;
		[context.invite] = args;
		this.getUser(context);
		this.getChannel(context);
		this.getGuild(context);
		this.getMember(context);
		this.attachExtras(context);
		await this.fetchPartials(context);
		return context;
	}

	async inviteDelete(...args) {
		const context = this.defaultContext;
		[context.invite] = args;
		this.getUser(context);
		this.getChannel(context);
		this.getGuild(context);
		this.getMember(context);
		this.attachExtras(context);
		await this.fetchPartials(context);
		return context;
	}

	async presenceUpdate(...args) {
		const context = this.defaultContext;
		[context.oldMember, context.newMember] = args;
		this.getUser(context);
		this.getGuild(context);
		this.getMember(context);
		this.attachExtras(context);
		await this.fetchPartials(context);
		return context;
	}

	async voiceStateUpdate(...args) {
		const context = this.defaultContext;
		[context.oldMember, context.newMember] = args;
		this.getUser(context);
		this.getGuild(context);
		this.getMember(context);
		this.attachExtras(context);
		await this.fetchPartials(context);
		return context;
	}

	async guildMemberSpeaking(...args) {
		const context = this.defaultContext;
		[context.member, context.speaking] = args;
		this.getUser(context);
		this.getGuild(context);
		this.attachExtras(context);
		await this.fetchPartials(context);
		return context;
	}

	async guildUpdate(...args) {
		const context = this.defaultContext;
		[context.oldGuild, context.newGuild] = args;
		this.getGuild(context);
		this.attachExtras(context);
		await this.fetchPartials(context);
		return context;
	}

	async commandMessage(...args) {
		const context = this.defaultContext;
		[context.message, context.args, context.fromPattern] = args;
		this.getUser(context);
		this.getChannel(context);
		this.getGuild(context);
		this.getMember(context);
		this.attachExtras(context);
		await this.fetchPartials(context);
		return context;
	}

	async message(...args) {
		const context = this.defaultContext;
		[context.message] = args;
		this.getUser(context);
		this.getChannel(context);
		this.getGuild(context);
		this.getMember(context);
		this.attachExtras(context);
		await this.fetchPartials(context);
		return context;
	}

	async messageDelete(...args) {
		const context = this.defaultContext;
		[context.message] = args;
		this.getUser(context);
		this.getChannel(context);
		this.getGuild(context);
		this.getMember(context);
		this.attachExtras(context);
		await this.fetchPartials(context);
		return context;
	}

	async messageReactionRemoveAll(...args) {
		const context = this.defaultContext;
		[context.message] = args;
		this.getUser(context);
		this.getChannel(context);
		this.getGuild(context);
		this.getMember(context);
		this.attachExtras(context);
		await this.fetchPartials(context);
		return context;
	}

	async messageDeleteBulk(...args) {
		const context = this.defaultContext;
		[context.messages] = args;
		this.getChannel(context);
		this.getGuild(context);
		this.attachExtras(context);
		await this.fetchPartials(context);
		return context;
	}

	async messageReactionAdd(...args) {
		const context = this.defaultContext;
		[context.reaction, context.user] = args;
		this.getMessage(context);
		this.getChannel(context);
		this.getGuild(context);
		this.getMember(context);
		this.attachExtras(context);
		await this.fetchPartials(context);
		return context;
	}

	async messageReactionRemove(...args) {
		const context = this.defaultContext;
		[context.reaction, context.user] = args;
		this.getMessage(context);
		this.getChannel(context);
		this.getGuild(context);
		this.getMember(context);
		this.attachExtras(context);
		await this.fetchPartials(context);
		return context;
	}

	async messageReactionRemoveEmoji(...args) {
		const context = this.defaultContext;
		[context.reaction] = args;
		this.getMessage(context);
		this.getChannel(context);
		this.getGuild(context);
		this.getMember(context);
		this.attachExtras(context);
		await this.fetchPartials(context);
		return context;
	}

	async messageUpdate(...args) {
		const context = this.defaultContext;
		[context.oldMessage, context.newMessage] = args;
		this.getMessage(context);
		this.getChannel(context);
		this.getGuild(context);
		this.getMember(context);
		this.attachExtras(context);
		await this.fetchPartials(context);
		return context;
	}

	async roleCreate(...args) {
		const context = this.defaultContext;
		[context.role] = args;
		this.getGuild(context);
		this.attachExtras(context);
		await this.fetchPartials(context);
		return context;
	}

	async roleDelete(...args) {
		const context = this.defaultContext;
		[context.role] = args;
		this.getGuild(context);
		this.attachExtras(context);
		await this.fetchPartials(context);
		return context;
	}

	async roleUpdate(...args) {
		const context = this.defaultContext;
		[context.oldRole, context.newRole] = args;
		context.role = context.newRole;
		this.getGuild(context);
		this.attachExtras(context);
		await this.fetchPartials(context);
		return context;
	}

	async typingStart(...args) {
		const context = this.defaultContext;
		[context.channel, context.user] = args;
		this.getGuild(context);
		this.getMember(context);
		this.attachExtras(context);
		await this.fetchPartials(context);
		return context;
	}

	async typingStop(...args) {
		const context = this.defaultContext;
		[context.channel, context.user] = args;
		this.getGuild(context);
		this.getMember(context);
		this.attachExtras(context);
		await this.fetchPartials(context);
		return context;
	}

	async userUpdate(...args) {
		const context = this.defaultContext;
		[context.oldUser, context.newUser] = args;
		this.getUser(context);
		this.attachExtras(context);
		await this.fetchPartials(context);
		return context;
	}

	async webhookUpdate(...args) {
		const context = this.defaultContext;
		[context.channel] = args;
		this.getGuild(context);
		this.attachExtras(context);
		await this.fetchPartials(context);
		return context;
	}
}

module.exports = new ContextGenerator();