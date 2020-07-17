const { camelCase, camelCaseKeys } = require("./utilities/utilities.js");
const Context = require("./base/baseContext.js");

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

	commandMessage(...args) {
		const context = new Context(this.client, "commandMessage");
		[context.message, context.args, context.fromPattern, context.collectorResult] = args;
		return context;
	}

	commandBlock(...args) {
		const context = new Context(this.client, "commandBlock");
		[context.message, context.blockReason, context.blockData] = args;
		return context;
	}

	commandCancel(...args) {
		const context = new Context(this.client, "commandCancel");
		[context.command, context.cancelReason, context.message, context.collectedArgs] = args;
		return context;
	}

	commandError(...args) {
		const context = new Context(this.client, "commandError");
		[context.command, context.error, context.message, context.args, context.fromPattern, context.commandResult] = args;
		return context;
	}

	commandPrefixChange(...args) {
		const context = new Context(this.client, "commandPrefixChange");
		[context.guild, context.prefix] = args;
		return context;
	}

	commandRegister(...args) {
		const context = new Context(this.client, "commandRegister");
		[context.command, context.registry] = args;
		return context;
	}

	commandReregister(...args) {
		const context = new Context(this.client, "commandReregister");
		[context.newCommand, context.oldCommand] = args;
		return context;
	}

	commandRun(...args) {
		const context = new Context(this.client, "commandRun");
		[context.command, context.commandResult, context.message, context.args, context.fromPattern, context.collectedArgs] = args;
		return context;
	}

	commandStatusChange(...args) {
		const context = new Context(this.client, "commandStatusChange");
		[context.guild, context.command, context.enabled] = args;
		return context;
	}

	commandUnregister(...args) {
		const context = new Context(this.client, "commandUnregister");
		[context.command] = args;
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

	levelUp(...args) {
		const context = new Context(this.client, "levelUp");
		[context.user, context.channel, context.guild, context.oldXpInfo, context.newXpInfo] = args;
		return context;
	}
}

module.exports = new ContextGenerator();