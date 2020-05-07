const { ArgumentType } = require("discord.js-commando");

class ContextualType extends ArgumentType {
	constructor(client) {
		super(client, "contextual");
	}

	validate(val, msg) {
		const value = val.toLowerCase();
		if (["guild", "server"].includes(value))
			return msg.guild;
		if (["channel", "text", "textchannel"].includes(value))
			return msg.channel;
		if (["member"].includes(value))
			return msg.member;
		if (["user"].includes(value))
			return msg.author;
		if (["role"].includes(value))
			return msg.member.roles.highest || msg.member.roles.highest || msg.member.roles.cache.first;
		if (["voice", "voicechannel", "vc"].includes(value))
			return msg.member.voice.channelID && msg.member.voice.channel;
		if (["category"].includes(value))
			return msg.channel.parentID && msg.channel.parent;
		return false;
	}

	parse(val, msg) {
		const value = val.toLowerCase();
		if (["guild", "server"].includes(value))
			return msg.guild;
		if (["channel", "text", "textchannel"].includes(value))
			return msg.channel;
		if (["member"].includes(value))
			return msg.member;
		if (["user"].includes(value))
			return msg.author;
		if (["role"].includes(value))
			return msg.member.roles.highest || msg.member.roles.highest || msg.member.roles.cache.first;
		if (["voice", "voicechannel", "vc"].includes(value))
			return msg.member.voice.channelID && msg.member.voice.channel;
		if (["category"].includes(value))
			return msg.channel.parentID && msg.channel.parent;
		return null;
	}
}

module.exports = ContextualType;