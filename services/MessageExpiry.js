const BaseService = require("../src/base/baseService.js");
const { getDuration } = require("../src/utilities/utilities.js");

module.exports = class MessageExpiry extends BaseService {
	constructor(client) {
		super(client, {
			name: "Message Expiry Service",
			description: "Automatically deletes messages in a particular channel after a certain duration.",
			enabled: true,
			fetchPartials: true,
			guildOnly: true
		});
		this.toDelete = [];
	}

	onMessage(ctx) {
		const messageExpiryChannels = ctx.guildStorage.get("messageExpiryChannels") || ctx.guildStorage.set("messageExpiryChannels", []);
		const toExpire = messageExpiryChannels.find(({ id }) => id === ctx.channel.id);
		if (toExpire)
			this.toDelete.push({
				channelId: ctx.channel.id,
				messageId: ctx.message.id,
				userId: ctx.user.id,
				timestamp: ctx.message.createdTimestamp,
				duration: toExpire.duration,
				ignoredRoles: toExpire.ignoredRoles
			});
	}

	onMessageUpdate(ctx) {
		const messageExpiryChannels = ctx.guildStorage.get("messageExpiryChannels") || ctx.guildStorage.set("messageExpiryChannels", []);
		const toExpire = messageExpiryChannels.find(({ id }) => id === ctx.channel.id);
		if (toExpire)
			this.toDelete = this.toDelete.map(data => {
				return (data.messageId === ctx.message.id && data.channelId === ctx.channel.id)
					? { ...data, timestamp: ctx.message.editedTimestamp }
					: data;
			});
	}

	purgeDeleteQueue(channelId) {
		this.toDelete = this.toDelete.filter(data => data.channelId !== channelId);
	}

	async everyMinute(ctx) {
		const result = [];
		for (const data of this.toDelete) {
			const { channelId, messageId, userId, duration, timestamp } = data;
			const channel = ctx.client.channels.cache.get(channelId);
			if (!channel || !channel.guild || !channel.guild.members.cache.has(userId))
				continue;
			const member = channel.guild.members.cache.get(userId);
			if (!member)
				continue;
			if (data.ignoredRoles && data.ignoredRoles.some(roleId => member.roles.cache.has(roleId)))
				continue;

			if ((ctx.emittedTimestamp - timestamp) >= duration) {
				result.push(channel.bulkDelete([messageId]));
				this.toDelete = this.toDelete.filter(data => data.messageId !== messageId && data.channelId !== channelId);
			}
			else continue;
		}
		return Promise.all(result);
	}
};