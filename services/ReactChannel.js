// const urlRegex = require("url-regex-local")({ exact: false, strict: false });
const BaseService = require("../src/base/baseService.js");

module.exports = class ReactChannel extends BaseService {
	constructor(client) {
		super(client, {
			name: "React Channel Service",
			description: "Adds upvote/downvote/like/dislike reactions on messages containing a link, embed or attachment.",
			enabled: true,
			fetchPartials: true
		});
	}

	async onMessage(ctx) {
		if (ctx.message.author.bot) return;
		const reactchannels = ctx.globalStorage.get("reactchannels");
		if (!reactchannels) return ctx.globalStorage.set("reactchannels", []);
		const index = reactchannels.map(channel => channel.id).indexOf(ctx.channel.id);
		if (index > -1) {
			// if (ctx.message.attachments.size > 0 || ctx.message.embeds.length > 0 || urlRegex.test(ctx.message.cleanContent))
			for (const reaction of reactchannels[index].reactions)
				await ctx.message.react(reaction);
		}
	}
};