const BaseCommand = require("../../src/base/baseCommand.js");

module.exports = class Boomerang extends BaseCommand {
	constructor(client) {
		super(client, {
			name: "boomerang",
			group: "misc",
			description: "Boomerang someone in voice chat.",
			clientPermissions: ["SEND_MESSAGES", "EMBED_LINKS", "MOVE_MEMBERS"],
			userPermissions: ["ADMINISTRATOR"],
			args: [
				{
					key: "user",
					prompt: "User to boomerang.",
					type: "user",
					default: ""
				}
			]
		});
	}

	async task(ctx) {
		const member = ctx.args.user ? ctx.guild.members.cache.get(ctx.args.user.id) : ctx.guild.members.cache.get(ctx.user.id);
		let channels;
		if (!member || !member.voice || !member.voice.channel)
			return ctx.embed("User must be connected to a voice channel.");
		const currentVC = member.voice.channel;
		if (member.voice.channel.parent)
			channels = member.voice.channel.parent.children.array().filter(c => c.type === "voice");
		else if (!member.voice.channel.parent)
			channels = ctx.guild.channels.cache.array().filter(c => !c.parentID);
		if (channels.length <= 1)
			return ctx.embed("Not enough channels!");
		channels = channels.sort((a, b) => a.position - b.position);
		ctx.embed("Boomeranging!");
		for (const channel of channels) {
			await member.voice.setChannel(channel.id);
			await new Promise(resolve => setTimeout(resolve, 500));
		}
		await member.voice.setChannel(currentVC.id);
	}
};