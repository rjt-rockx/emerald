const { MessageEmbed, SnowflakeUtil } = require("discord.js");
const logger = require("../utilities/logger.js");
const paginator = require("../utilities/paginator.js");
const { idSort, byText } = require("../utilities/utilities.js");
const diff = require("../utilities/diffUtils.js");
const NadekoConnectorClient = require("../utilities/nadekoConnector.js");
const dataHandler = require("../handlers/dataHandler.js");

const AuditLogEvents = {
	all: null,
	guildUpdate: 1,
	channelCreate: 10,
	channelUpdate: 11,
	channelDelete: 12,
	channelOverwriteCreate: 13,
	channelOverwriteUpdate: 14,
	channelOverwriteDelete: 15,
	memberKick: 20,
	memberPrune: 21,
	guildBanAdd: 22,
	guildBanRemove: 23,
	guildMemberUpdate: 24,
	memberRoleUpdate: 25,
	memberMove: 26,
	memberDisconnect: 27,
	botAdd: 28,
	roleCreate: 30,
	roleUpdate: 31,
	roleDelete: 32,
	inviteCreate: 40,
	inviteUpdate: 41,
	inviteDelete: 42,
	webhookCreate: 50,
	webhookUpdate: 51,
	webhookDelete: 52,
	emojiCreate: 60,
	emojiUpdate: 61,
	emojiDelete: 62,
	messageDelete: 72,
	messageDeleteBulk: 73,
	messagePin: 74,
	messageUnpin: 75,
	integrationCreate: 80,
	integrationUpdate: 81,
	integrationDelete: 82
};
module.exports = class Context {
	constructor(client, event, data = {}) {
		this.client = client;
		this.event = event;
		this.emittedAt = new Date();
		this.logger = logger;
		this.paginator = paginator;
		this.paginate = (...data) => new this.paginator(this, ...data).initialize();
		this.partialErrorHandler = () => { };
		Object.assign(this, data);
	}

	clone(data = {}) {
		const newContext = Object.assign(Object.create(this), this);
		Object.assign(newContext, data);
		return newContext;
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

	async fetchAuditLog() {
		if (!this.guild) return;
		const hasAuditLogPermission = this.guild.member(this.client.user).hasPermission("VIEW_AUDIT_LOG");
		if (!hasAuditLogPermission)
			return Promise.reject("No audit log permission.");

		let types = [];
		if (Object.keys(AuditLogEvents).includes(this.event))
			types = [this.event];
		else if (this.event === "channelPinsUpdate")
			types = ["messagePin", "messageUnpin"];
		else if (this.event === "guildMemberAdd" && this.member.user.bot)
			types = ["botAdd"];
		else if (this.event === "guildMemberAdd" && !this.member.user.bot)
			types = ["inviteUpdate"];
		else if (this.event === "guildMemberRemove")
			types = ["memberKick", "memberPrune"];
		if (this.event === "guildMemberUpdate")
			types.push("memberRoleUpdate");
		if (this.event === "webhookUpdate")
			types.push("webhookCreate", "webhookDelete");
		types = [...new Set(types)];
		const entries = [];
		for (const type of types) {
			const fetchedAuditLogs = await this.guild.fetchAuditLogs({
				type: AuditLogEvents[type],
				limit: 2,
				before: SnowflakeUtil.generate(this.emittedAt.getTime() + 2000)
			}).catch(() => { });
			if (!fetchedAuditLogs || !fetchedAuditLogs.entries) break;
			entries.push(...fetchedAuditLogs.entries.values());
		}
		this._assignMatchingAuditLogEntry(entries.sort(idSort).reverse(), types);
		return this;
	}

	_assignMatchingAuditLogEntry(entries, types) {
		let matchingEntry;
		// console.log("entries:\n" + entries.map(e => JSON.stringify(e, null, 2)).join("\n"));
		console.log("types:" + types);
		if (["channelCreate", "channelDelete", "channelUpdate"].includes(this.event)) {
			matchingEntry = entries.find(e => (typeof e.target === "string" ? e.target : e.target.id) === this.channel.id);
			if (matchingEntry) {
				this.auditLogEntry = matchingEntry;
				this[byText(matchingEntry.actionType)] = matchingEntry.executor;
			}
		}
		else if (["roleCreate", "roleDelete", "roleUpdate"].includes(this.event)) {
			matchingEntry = entries.find(e => (typeof e.target === "string" ? e.target : e.target.id) === this.role.id);
			if (matchingEntry) {
				this.auditLogEntry = matchingEntry;
				this[byText(matchingEntry.actionType)] = matchingEntry.executor;
			}
		}
		else if (["emojiCreate", "emojiDelete", "emojiUpdate"].includes(this.event)) {
			matchingEntry = entries.find(e => (typeof e.target === "string" ? e.target : e.target.id) === this.emoji.id);
			if (matchingEntry) {
				this.auditLogEntry = matchingEntry;
				this[byText(matchingEntry.actionType)] = matchingEntry.executor;
			}
		}
		else if (["guildMemberAdd"].includes(this.event)) {
			matchingEntry = entries.find(e => (e.target.id === this.member.id) && this.member.user.bot);
			if (matchingEntry) {
				this.auditLogEntry = matchingEntry;
				this.addedBy = matchingEntry.executor;
			}
		}
		else if (["guildMemberRemove"].includes(this.event)) {
			matchingEntry = entries.find(e => (e.target.id === this.member.id) && this.member.user.bot);
			if (matchingEntry) {
				this.auditLogEntry = matchingEntry;
				const executorText = matchingEntry.action === "MEMBER_KICK" ? "kickedBy" : "prunedBy";
				this[executorText] = matchingEntry.executor;
			}
		}
		else if (["guildBanAdd"].includes(this.event)) {
			matchingEntry = entries.find(e => e.target.id === this.user.id);
			if (matchingEntry) {
				this.auditLogEntry = matchingEntry;
				this.bannedBy = matchingEntry.executor;
			}
		}
		else if (["guildBanRemove"].includes(this.event)) {
			matchingEntry = entries.find(e => e.target.id === this.user.id);
			if (matchingEntry) {
				this.auditLogEntry = matchingEntry;
				this.unbannedBy = matchingEntry.executor;
			}
		}
		else if (["guildMemberUpdate"].includes(this.event)) {
			matchingEntry = entries.find(e => (typeof e.target === "string" ? e.target : e.target.id) === this.user.id);
			if (matchingEntry) {
				this.auditLogEntry = matchingEntry;
				this.updatedBy = matchingEntry.executor;
			}
		}
		else if (["inviteCreate", "inviteDelete", "inviteUpdate"].includes(this.event)) {
			matchingEntry = entries.find(e => (typeof e.target === "string" ? e.target : e.target.id) === this.invite.id);
			if (matchingEntry) {
				this.auditLogEntry = matchingEntry;
				this[byText(matchingEntry.actionType)] = matchingEntry.executor;
			}
		}
		else if (["messageDelete"].includes(this.event)) {
			matchingEntry = entries.find(e => e.extra.channel.id === this.message.channel.id);
			if (matchingEntry) {
				this.auditLogEntry = matchingEntry;
				this.deletedBy = matchingEntry.executor;
			}
		}
		else if (["messageDeleteBulk"].includes(this.event)) {
			matchingEntry = entries.find(e => (typeof e.target === "string" ? e.target : e.target.id) === this.channel.id);
			if (matchingEntry) {
				this.auditLogEntry = matchingEntry;
				this.deletedBy = matchingEntry.executor;
			}
		}
		else if (["channelPinsUpdate"].includes(this.event)) {
			matchingEntry = entries.find(e => e.extra.channel.id === this.channel.id);
			if (matchingEntry) {
				this.auditLogEntry = matchingEntry;
				const executorText = matchingEntry.action === "MESSAGE_PIN" ? "pinnedBy" : "unpinnedBy";
				this[executorText] = matchingEntry.executor;
			}
		}
		else if (["guildUpdate"].includes(this.event)) {
			[matchingEntry] = entries;
			this.auditLogEntry = matchingEntry;
			this.updatedBy = matchingEntry.executor;
		}
		else if (["webhookUpdate"].includes(this.event)) {
			console.log(entries);
			matchingEntry = entries.find(e => e.target.channelID === this.channel.id);
			this.auditLogEntry = matchingEntry;
			this[byText(matchingEntry.actionType)] = matchingEntry.executor;
		}
	}

	get isUpdateEvent() {
		const updateEvents = ["guildUpdate", "channelUpdate", "emojiUpdate", "guildMemberUpdate", "voiceStateUpdate", "presenceUpdate", "messageUpdate", "roleUpdate", "userUpdate"];
		return updateEvents.includes(this.event);
	}

	get changeCount() {
		return this.changes ? Object.keys(this.changes).length : 0;
	}

	get changes() {
		if (!this.isUpdateEvent) return null;
		else if (this.isUpdateEvent && this._changes)
			return Object.keys(this._changes).length ? this._changes : null;
		else if (this.event === "guildUpdate")
			this._changes = diff(this.oldGuild, this.newGuild);
		else if (this.event === "channelUpdate")
			this._changes = diff(this.oldChannel, this.newChannel);
		else if (this.event === "emojiUpdate")
			this._changes = diff(this.oldEmoji, this.newEmoji);
		else if (["guildMemberUpdate", "voiceStateUpdate", "presenceUpdate"].includes(this.event))
			this._changes = diff(this.oldMember, this.newMember);
		else if (this.event === "messageUpdate")
			this._changes = diff(this.oldMessage, this.newMessage);
		else if (this.event === "roleUpdate")
			this._changes = diff(this.oldRole, this.newRole);
		else if (this.event === "userUpdate") {
			this._changes = diff(this.oldUser, this.newUser);
		}
		return Object.keys(this._changes).length ? this._changes : null;
	}

	get services() {
		return this.client.services;
	}

	get emittedTimestamp() {
		return this.emittedAt.getTime();
	}

	get message() {
		return this._message
			|| this.newMessage
			|| (this.messages && this.messages.first())
			|| (this.reaction && this.reaction.message);
	}

	set message(message) {
		this._message = message;
	}

	get command() {
		return this._command
			|| this.newCommand
			|| (this._message && this._message.command);
	}

	set command(command) {
		this._command = command;
	}

	get user() {
		return this._user
			|| this.newUser
			|| (this._member && this._member.user)
			|| (this.newMember && this.newMember.user)
			|| (this._message && this._message.author)
			|| (this.invite && this.invite.inviter);
	}

	set user(user) {
		this._user = user;
	}

	get member() {
		return this._member
			|| this.newMember
			|| (this._message && this._message.member)
			|| (this._guild && this._user && this._guild.members.resolve(this._user.id));
	}

	set member(member) {
		this._member = member;
	}

	get channel() {
		return this._channel
			|| this.newChannel
			|| (this._message && this._message.channel)
			|| (this.reaction && this.reaction.message && this.reaction.message.channel)
			|| (this.messages && this.messages.first().channel)
			|| (this.invite && this.invite.channel);
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
			|| this.newGuild
			|| (this._message && this._message.guild)
			|| (this.messages && this.messages.first() && this.messages.first().guild)
			|| (this._channel && this._channel.guild)
			|| (this.newChannel && this.newChannel.guild)
			|| (this.emoji && this.emoji.guild)
			|| (this.reaction && this.reaction.message && this.reaction.message.guild)
			|| (this.newEmoji && this.newEmoji.guild)
			|| (this._member && this._member.guild)
			|| (this.newMember && this.newMember.guild)
			|| (this._role && this._role.guild)
			|| (this.invite && this.invite.guild);
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

	getGuildStorage(guildID) {
		return dataHandler.getGuildStorage(guildID);
	}

	get bot() {
		return this.client.user;
	}

	get me() {
		return this.guild && this.guild.me;
	}

	get botMember() {
		return this.guild && this.guild.me;
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

	get level() {
		return this.newXpInfo && this.newXpInfo.level;
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
		if (typeof data[0] === "string")
			return this.message ? this.message.embed({ description: data[0] }) : this.channel.send(new MessageEmbed({ description: data[0] }));
		return this.message ? this.message.embed(...data) : this.channel.send(new MessageEmbed(...data));
	}

	dm(...data) {
		return this.user && this.user.send(...data);
	}

	dmEmbed(...data) {
		return this.user && (
			typeof data[0] === "string"
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

	get nadekoConnector() {
		if (this._nadekoConnector instanceof NadekoConnectorClient)
			return this._nadekoConnector;

		if (!this.guildStorage)
			return undefined;
		const nadekoConnector = this.guildStorage.get("nadekoconnector");
		if (!nadekoConnector)
			return undefined;
		if (nadekoConnector && nadekoConnector.enabled) {
			this._nadekoConnector = new NadekoConnectorClient(nadekoConnector.address, nadekoConnector.password);
			return this._nadekoConnector;
		}
		return undefined;
	}
};