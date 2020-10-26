const BaseCommand = require("../../src/base/baseCommand.js");

module.exports = class ListNotes extends BaseCommand {
	constructor(client) {
		super(client, {
			name: "listnotes",
			group: "notes",
			description: "List all notes on a specified user.",
			clientPermissions: ["SEND_MESSAGES", "EMBED_LINKS"],
			userPermissions: ["MANAGE_MESSAGES"],
			args: [
				{
					key: "user",
					prompt: "User to add the note on.",
					type: "user"
				}
			]
		});
	}

	generateCompactTimeString(timestamp) {
		const usableDate = new Date(timestamp);
		return [
			usableDate.getUTCDate(),
			usableDate.getUTCMonth(),
			usableDate.getUTCFullYear()
		].join("/") + " " + [usableDate.getUTCHours(), usableDate.getUTCMinutes()].join(":");
	}

	async task(ctx) {
		const targetUserId = ctx.args.user.id;
		let notes = ctx.guildStorage.get("notes");
		if (!notes)
			notes = {};
		if (!Object.keys(notes).includes(targetUserId))
			notes[targetUserId] = [];
		if (!notes[targetUserId].length)
			ctx.embed({ description: "No notes found on this user." });
		if (notes[targetUserId].length) {
			const noteFields = notes[targetUserId].map((noteEntry, number) => ({
				name: `${number + 1}. ${ctx.client.users.cache.has(noteEntry.addedBy) ? ctx.client.users.cache.get(noteEntry.addedBy).tag : noteEntry.addedBy} on ${this.generateCompactTimeString(noteEntry.timestamp)}`,
				value: noteEntry.note,
				inline: false
			}));
			return ctx.paginate(noteFields, {
				embedTemplate: {
					title: `Notes on ${ctx.args.user.tag}`,
					thumbnail: { url: ctx.args.user.displayAvatarURL({ format: "png", dynamic: true, size: 1024 }) }
				}
			});
		}
	}
};