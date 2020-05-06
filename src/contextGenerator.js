const { MessageEmbed } = require("discord.js");
const logger = require("./logger.js");
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
		return this;
	}

	get defaultContext() {
		return { client: this.client, emittedAt: new Date(), globalStorage: dataHandler.getGlobalStorage(), logger };
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
		if (context.guild)
			context.guildStorage = dataHandler.getGuildStorage(context.guild.id);
	}

	attachExtras(context) {
		if (context.message) {
			context.react = (...data) => context.message.react(...data);
			context.msg = context.message;
			context.send = (...data) => context.message.channel.send(...data);
			context.embed = data => data instanceof MessageEmbed ? context.send(data) : context.send(new MessageEmbed(data));
			if (context.message.command)
				context.command = context.message.command;
		}
		if (context.user) {
			context.dm = (...data) => context.user.send(...data);
			context.dmEmbed = data => data instanceof MessageEmbed ? context.dm(data) : context.dm(new MessageEmbed(data));
		}
		if (context.channel) {
			context.selfDestruct = (data, seconds = 10) => context.channel.send(data).then(msg => msg.delete(seconds * 1000));
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

	channelCreate(...args) {
		const context = this.defaultContext;
		[context.channel] = args;
		this.getGuild(context);
		this.attachExtras(context);
		return context;
	}

	channelDelete(...args) {
		const context = this.defaultContext;
		[context.channel] = args;
		this.getGuild(context);
		this.attachExtras(context);
		return context;
	}

	channelPinsUpdate(...args) {
		const context = this.defaultContext;
		[context.channel, context.time] = args;
		this.getGuild(context);
		this.attachExtras(context);
		return context;
	}

	channelUpdate(...args) {
		const context = this.defaultContext;
		[context.oldChannel, context.newChannel] = args;
		this.getChannel(context);
		this.getGuild(context);
		this.attachExtras(context);
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

	emojiCreate(...args) {
		const context = this.defaultContext;
		[context.emoji] = args;
		this.getGuild(context);
		this.attachExtras(context);
		return context;
	}

	emojiDelete(...args) {
		const context = this.defaultContext;
		[context.emoji] = args;
		this.getGuild(context);
		this.attachExtras(context);
		return context;
	}

	emojiUpdate(...args) {
		const context = this.defaultContext;
		[context.oldEmoji, context.newEmoji] = args;
		this.getGuild(context);
		this.attachExtras(context);
		return context;
	}

	guildBanAdd(...args) {
		const context = this.defaultContext;
		[context.guild, context.user] = args;
		this.attachExtras(context);
		return context;
	}

	guildBanRemove(...args) {
		const context = this.defaultContext;
		[context.guild, context.user] = args;
		this.attachExtras(context);
		return context;
	}

	guildCreate(...args) {
		const context = this.defaultContext;
		[context.guild] = args;
		this.attachExtras(context);
		return context;
	}

	guildDelete(...args) {
		const context = this.defaultContext;
		[context.guild] = args;
		this.attachExtras(context);
		return context;
	}

	guildMemberAdd(...args) {
		const context = this.defaultContext;
		[context.member] = args;
		this.getUser(context);
		this.getGuild(context);
		this.attachExtras(context);
		return context;
	}

	guildMemberRemove(...args) {
		const context = this.defaultContext;
		[context.member] = args;
		this.getUser(context);
		this.getGuild(context);
		this.attachExtras(context);
		return context;
	}

	guildMemberUpdate(...args) {
		const context = this.defaultContext;
		[context.oldMember, context.newMember] = args;
		this.getUser(context);
		this.getGuild(context);
		this.getMember(context);
		this.attachExtras(context);
		return context;
	}

	inviteCreate(...args) {
		const context = this.defaultContext;
		[context.invite] = args;
		this.getUser(context);
		this.getChannel(context);
		this.getGuild(context);
		this.getMember(context);
		this.attachExtras(context);
		return context;
	}

	inviteDelete(...args) {
		const context = this.defaultContext;
		[context.invite] = args;
		this.getUser(context);
		this.getChannel(context);
		this.getGuild(context);
		this.getMember(context);
		this.attachExtras(context);
		return context;
	}

	presenceUpdate(...args) {
		const context = this.defaultContext;
		[context.oldMember, context.newMember] = args;
		this.getUser(context);
		this.getGuild(context);
		this.getMember(context);
		this.attachExtras(context);
		return context;
	}

	voiceStateUpdate(...args) {
		const context = this.defaultContext;
		[context.oldMember, context.newMember] = args;
		this.getUser(context);
		this.getGuild(context);
		this.getMember(context);
		this.attachExtras(context);
		return context;
	}

	guildMemberSpeaking(...args) {
		const context = this.defaultContext;
		[context.member, context.speaking] = args;
		this.getUser(context);
		this.getGuild(context);
		this.attachExtras(context);
		return context;
	}

	guildUpdate(...args) {
		const context = this.defaultContext;
		[context.oldGuild, context.newGuild] = args;
		this.getGuild(context);
		this.attachExtras(context);
		return context;
	}

	commandMessage(...args) {
		const context = this.defaultContext;
		[context.message, context.args, context.fromPattern] = args;
		this.getUser(context);
		this.getChannel(context);
		this.getGuild(context);
		this.getMember(context);
		this.attachExtras(context);
		return context;
	}

	message(...args) {
		const context = this.defaultContext;
		[context.message] = args;
		this.getUser(context);
		this.getChannel(context);
		this.getGuild(context);
		this.getMember(context);
		this.attachExtras(context);
		this.getCommandPermissions(context);
		return context;
	}

	messageDelete(...args) {
		const context = this.defaultContext;
		[context.message] = args;
		this.getUser(context);
		this.getChannel(context);
		this.getGuild(context);
		this.getMember(context);
		this.attachExtras(context);
		return context;
	}

	messageReactionRemoveAll(...args) {
		const context = this.defaultContext;
		[context.message] = args;
		this.getUser(context);
		this.getChannel(context);
		this.getGuild(context);
		this.getMember(context);
		this.attachExtras(context);
		return context;
	}

	messageDeleteBulk(...args) {
		const context = this.defaultContext;
		[context.messages] = args;
		this.getChannel(context);
		this.getGuild(context);
		this.attachExtras(context);
		return context;
	}

	messageReactionAdd(...args) {
		const context = this.defaultContext;
		[context.reaction, context.user] = args;
		this.getMessage(context);
		this.getChannel(context);
		this.getGuild(context);
		this.getMember(context);
		this.attachExtras(context);
		return context;
	}

	messageReactionRemove(...args) {
		const context = this.defaultContext;
		[context.reaction, context.user] = args;
		this.getMessage(context);
		this.getChannel(context);
		this.getGuild(context);
		this.getMember(context);
		this.attachExtras(context);
		return context;
	}

	messageReactionRemoveEmoji(...args) {
		const context = this.defaultContext;
		[context.reaction] = args;
		this.getMessage(context);
		this.getChannel(context);
		this.getGuild(context);
		this.getMember(context);
		this.attachExtras(context);
		return context;
	}

	messageUpdate(...args) {
		const context = this.defaultContext;
		[context.oldMessage, context.newMessage] = args;
		this.getMessage(context);
		this.getChannel(context);
		this.getGuild(context);
		this.getMember(context);
		this.attachExtras(context);
		return context;
	}

	roleCreate(...args) {
		const context = this.defaultContext;
		[context.role] = args;
		this.getGuild(context);
		this.attachExtras(context);
		return context;
	}

	roleDelete(...args) {
		const context = this.defaultContext;
		[context.role] = args;
		this.getGuild(context);
		this.attachExtras(context);
		return context;
	}

	roleUpdate(...args) {
		const context = this.defaultContext;
		[context.oldRole, context.newRole] = args;
		context.role = context.newRole;
		this.getGuild(context);
		this.attachExtras(context);
		return context;
	}

	typingStart(...args) {
		const context = this.defaultContext;
		[context.channel, context.user] = args;
		this.getGuild(context);
		this.getMember(context);
		this.attachExtras(context);
		return context;
	}

	typingStop(...args) {
		const context = this.defaultContext;
		[context.channel, context.user] = args;
		this.getGuild(context);
		this.getMember(context);
		this.attachExtras(context);
		return context;
	}

	userUpdate(...args) {
		const context = this.defaultContext;
		[context.oldUser, context.newUser] = args;
		this.getUser(context);
		this.attachExtras(context);
		return context;
	}

	webhookUpdate(...args) {
		const context = this.defaultContext;
		[context.channel] = args;
		this.getGuild(context);
		this.attachExtras(context);
		return context;
	}
}

module.exports = new ContextGenerator();