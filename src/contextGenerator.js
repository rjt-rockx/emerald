const { MessageEmbed } = require("discord.js");
const logger = require("./utilities/logger.js");
const paginator = require("./utilities/paginator.js");
const dataHandler = require("./handlers/dataHandler.js");
const { camelCase, camelCaseKeys } = require("./utilities/utilities.js");
class Context {
	constructor(client, event) {
		this.client = client;
		this.event = event;
		this.emittedAt = new Date();
		this.logger = logger;
		this.paginator = paginator;
		this.paginate = (...data) => new this.paginator(this, ...data);
		this.partialErrorHandler = () => { };
	}

	async fetchPartials() {
		const props = ["message", "newMessage", "channel", "newChannel", "oldChannel", "reaction", "oldMessage", "newMessage"];
		this.resolvedPartials = await Promise.all(props.map(prop => {
			if (this[prop] && this[prop].partial)
				return this[prop].fetch().catch((...args) => this.partialErrorHandler(...args));
			return Promise.resolve(this[prop]);
		}));
		return this;
	}

	get message() {
		return this._message
			|| (this.reaction && this.reaction.message)
			|| this.newMessage;
	}

	set message(message) {
		this._message = message;
	}

	get command() {
		return this._message && this._message.command;
	}

	get user() {
		return this._user
			|| (this._member && this._member.user)
			|| (this._message && this._message.author)
			|| (this.invite && this.invite.inviter)
			|| this.newUser;
	}

	set user(user) {
		this._user = user;
	}

	get member() {
		return this._member
			|| this.newMember
			|| (this._guild && this._user && this._guild.members.resolve(this._user.id));
	}

	set member(member) {
		this._member = member;
	}

	get channel() {
		return this._channel
			|| (this._message && this._message.channel)
			|| (this.reaction && this.reaction.message && this.reaction.message.channel)
			|| (this._messages && this._messages.first().channel)
			|| (this.invite && this.invite.channel)
			|| this.newChannel;
	}

	set channel(channel) {
		this._channel = channel;
	}

	get role() {
		return this._role
			|| this.newRole;
	}

	set role(role) {
		this._role = role;
	}

	get guild() {
		return this._guild
			|| (this._message && this._message.guild)
			|| (this._channel && this._channel.guild)
			|| (this.emoji && this.emoji.guild)
			|| (this.reaction && this.reaction.message && this.reaction.message.guild)
			|| (this.newEmoji && this.newEmoji.guild)
			|| (this._member && this._member.guild)
			|| (this.newMember && this.newMember.guild)
			|| (this._role && this._role.guild)
			|| (this.invite && this.invite.guild)
			|| this.newGuild;
	}

	set guild(guild) {
		this._guild = guild;
	}

	get globalStorage() {
		return dataHandler.getGlobalStorage();
	}

	get guildStorage() {
		return this.guild && dataHandler.getGuildStorage(this.guild.id);
	}

	get bot() {
		return this.client.user;
	}

	get botMember() {
		return this.guild && this.guild.members.resolve(this.bot);
	}

	get msg() {
		return this.message;
	}

	get prefix() {
		return (this.guild && this.guild.commandPrefix)
			|| this.client.commandPrefix;
	}

	react(...data) {
		return this.message && this.message.react(...data);
	}

	code(content, language, ...data) {
		return this.message && this.message.code(language, content, ...data);
	}

	send(...data) {
		return this.message && this.message.say(...data);
	}

	say(...data) {
		return this.message && this.message.say(...data);
	}

	edit(...data) {
		return this.message && this.message.edit(...data);
	}

	reply(...data) {
		return this.message && this.message.reply(...data);
	}

	replyEmbed(...data) {
		return this.message && this.message.replyEmbed(...data);
	}

	embed(...data) {
		return this.message && (
			data[0] instanceof String
				? this.message.embed({ description: data[0] })
				: this.message.embed(...data)
		);
	}

	dm(...data) {
		return this.user && this.user.send(...data);
	}

	dmEmbed(...data) {
		return this.user && (
			data[0] instanceof String
				? this.user.send(new MessageEmbed({ description: data[0] }))
				: this.user.send(...data)
		);
	}

	selfDestruct(data, seconds = 10) {
		return this.channel && this.channel.send(data).then(m => m.delete({ timeout: seconds * 1000 }));
	}

	selfDestructEmbed(data, seconds = 10) {
		return this.channel && this.channel.send(new MessageEmbed(data)).then(m => m.delete({ timeout: seconds * 1000 }));
	}
}

class ContextGenerator {
	async initialize(client) {
		this.client = client;
		this.client.contextGenerator = this;
		return this;
	}

	timedEvent() {
		return this.defaultContext;
	}

	raw(...args) {
		const context = new Context(this.client, "raw");
		const [{ data, type }] = args;
		if (data && type) {
			context.data = camelCaseKeys(data);
			context.type = camelCase(type.toLowerCase());
		}
		return context;
	}

	channelCreate(...args) {
		const context = new Context(this.client, "channelCreate");
		[context.channel] = args;
		return context;
	}

	channelDelete(...args) {
		const context = new Context(this.client, "channelDelete");
		[context.channel] = args;
		return context;
	}

	channelPinsUpdate(...args) {
		const context = new Context(this.client, "channelPinsUpdate");
		[context.channel, context.time] = args;
		return context;
	}

	channelUpdate(...args) {
		const context = new Context(this.client, "channelUpdate");
		[context.oldChannel, context.newChannel] = args;
		return context;
	}

	debug(...args) {
		const context = new Context(this.client, "debug");
		[context.info] = args;
		return context;
	}

	warn(...args) {
		const context = new Context(this.client, "warn");
		[context.info] = args;
		return context;
	}

	emojiCreate(...args) {
		const context = new Context(this.client, "emojiCreate");
		[context.emoji] = args;
		return context;
	}

	emojiDelete(...args) {
		const context = new Context(this.client, "emojiDelete");
		[context.emoji] = args;
		return context;
	}

	emojiUpdate(...args) {
		const context = new Context(this.client, "emojiUpdate");
		[context.oldEmoji, context.newEmoji] = args;
		return context;
	}

	guildBanAdd(...args) {
		const context = new Context(this.client, "guildBanAdd");
		[context.guild, context.user] = args;
		return context;
	}

	guildBanRemove(...args) {
		const context = new Context(this.client, "guildBanRemove");
		[context.guild, context.user] = args;
		return context;
	}

	guildCreate(...args) {
		const context = new Context(this.client, "guildCreate");
		[context.guild] = args;
		return context;
	}

	guildDelete(...args) {
		const context = new Context(this.client, "guildDelete");
		[context.guild] = args;
		return context;
	}

	guildMemberAdd(...args) {
		const context = new Context(this.client, "guildMemberAdd");
		[context.member] = args;
		return context;
	}

	guildMemberRemove(...args) {
		const context = new Context(this.client, "guildMemberRemove");
		[context.member] = args;
		return context;
	}

	guildMemberUpdate(...args) {
		const context = new Context(this.client, "guildMemberUpdate");
		[context.oldMember, context.newMember] = args;
		return context;
	}

	inviteCreate(...args) {
		const context = new Context(this.client, "inviteCreate");
		[context.invite] = args;
		return context;
	}

	inviteDelete(...args) {
		const context = new Context(this.client, "inviteDelete");
		[context.invite] = args;
		return context;
	}

	presenceUpdate(...args) {
		const context = new Context(this.client, "presenceUpdate");
		[context.oldMember, context.newMember] = args;
		return context;
	}

	voiceStateUpdate(...args) {
		const context = new Context(this.client, "voiceStateUpdate");
		[context.oldMember, context.newMember] = args;
		return context;
	}

	guildMemberSpeaking(...args) {
		const context = new Context(this.client, "guildMemberSpeaking");
		[context.member, context.speaking] = args;
		return context;
	}

	guildUpdate(...args) {
		const context = new Context(this.client, "guildUpdate");
		[context.oldGuild, context.newGuild] = args;
		return context;
	}

	commandMessage(...args) {
		const context = new Context(this.client, "commandMessage");
		[context.message, context.args, context.fromPattern] = args;
		return context;
	}

	message(...args) {
		const context = new Context(this.client, "message");
		[context.message] = args;
		return context;
	}

	messageDelete(...args) {
		const context = new Context(this.client, "messageDelete");
		[context.message] = args;
		return context;
	}

	messageReactionRemoveAll(...args) {
		const context = new Context(this.client, "messageReactionRemoveAll");
		[context.message] = args;
		return context;
	}

	messageDeleteBulk(...args) {
		const context = new Context(this.client, "messageDeleteBulk");
		[context.messages] = args;
		return context;
	}

	messageReactionAdd(...args) {
		const context = new Context(this.client, "messageReactionAdd");
		[context.reaction, context.user] = args;
		return context;
	}

	messageReactionRemove(...args) {
		const context = new Context(this.client, "messageReactionRemove");
		[context.reaction, context.user] = args;
		return context;
	}

	messageReactionRemoveEmoji(...args) {
		const context = new Context(this.client, "messageReactionRemoveEmoji");
		[context.reaction] = args;
		return context;
	}

	messageUpdate(...args) {
		const context = new Context(this.client, "messageUpdate");
		[context.oldMessage, context.newMessage] = args;
		return context;
	}

	roleCreate(...args) {
		const context = new Context(this.client, "roleCreate");
		[context.role] = args;
		return context;
	}

	roleDelete(...args) {
		const context = new Context(this.client, "roleDelete");
		[context.role] = args;
		return context;
	}

	roleUpdate(...args) {
		const context = new Context(this.client, "roleUpdate");
		[context.oldRole, context.newRole] = args;
		context.role = context.newRole;
		return context;
	}

	typingStart(...args) {
		const context = new Context(this.client, "typingStart");
		[context.channel, context.user] = args;
		return context;
	}

	typingStop(...args) {
		const context = new Context(this.client, "typingStop");
		[context.channel, context.user] = args;
		return context;
	}

	userUpdate(...args) {
		const context = new Context(this.client, "userUpdate");
		[context.oldUser, context.newUser] = args;
		return context;
	}

	webhookUpdate(...args) {
		const context = new Context(this.client, "webhookUpdate");
		[context.channel] = args;
		return context;
	}
}

module.exports = new ContextGenerator();