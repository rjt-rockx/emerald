const { MessageEmbed } = require("discord.js");
const logger = require("../utilities/logger.js");
const paginator = require("../utilities/paginator.js");
const dataHandler = require("../handlers/dataHandler.js");

module.exports = class Context {
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
		return this._command
			|| (this._message && this._message.command)
			|| this.newCommand;
	}

	set command(command) {
		this._command = command;
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
		return this._prefix
			|| (this.guild && this.guild.commandPrefix)
			|| this.client.commandPrefix;
	}

	set prefix(prefix) {
		this._prefix = prefix;
	}

	get error() {
		return this._error;
	}

	set error(error) {
		this._error = error;
	}

	get err() {
		return this.error;
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
};