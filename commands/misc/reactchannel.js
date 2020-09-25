const BaseCommand = require("../../src/base/baseCommand.js");
const reactionMap = {
	like: ["👍"],
	thumbs: ["👍", "👎"],
	upvote: ["🔺"],
	triangles: ["🔺", "🔻"],
	up: ["⬆️"],
	arrows: ["⬆️", "⬇️"]
};

module.exports = class ReactChannel extends BaseCommand {
	constructor(client) {
		super(client, {
			name: "reactchannel",
			description: "Add or remove a react channel. Messages containing a link or embed will be reacted with a vote emoji in this channel.",
			group: "misc",
			memberName: "reactchannel",
			userPermissions: ["ADMINISTRATOR"],
			clientPermissions: ["SEND_MESSAGES", "EMBED_LINKS"],
			args: [
				{
					key: "enabled",
					prompt: "Whether to enable or disable reactchannel.",
					type: "string",
					oneOf: ["enable", "disable"]
				},
				{
					key: "channel",
					prompt: "Channel to react in.",
					type: "channel"
				},
				{
					key: "reactionType",
					prompt: "One of the folowing:\n" + Object.entries(reactionMap).map(([key, value]) => `\`${(key)}\` - ${value.join(", ")}`).join(", "),
					type: "string",
					oneOf: Object.keys(reactionMap).map(key => key.toLowerCase()),
					default: "upvote"
				}
			]
		});
	}

	async task(ctx) {
		let reactchannels = ctx.globalStorage.get("reactchannels") || ctx.globalStorage.set("reactchannels", []);
		if (ctx.args.enabled === "enable") {
			if (reactchannels.map(channel => channel.id).includes(ctx.args.channel.id))
				reactchannels = reactchannels.filter(channel => channel.id !== ctx.args.channel.id);
			reactchannels.push({
				id: ctx.args.channel.id,
				reactions: typeof reactionMap[ctx.args.reactionType.toLowerCase()] === "undefined" ? reactionMap.upvote : reactionMap[ctx.args.reactionType.toLowerCase()]
			});
		}
		else if (ctx.args.enabled === "disable")
			reactchannels = reactchannels.filter(channel => channel.id !== ctx.args.channel.id);
		ctx.globalStorage.set("reactchannels", reactchannels);
		return ctx.embed(`React Channel successfully ${ctx.args.enabled === "enable" ? "set to" : "removed from"} #${ctx.args.channel.name}`);
	}
};