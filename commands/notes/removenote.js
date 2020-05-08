const BaseCommand = require("../../src/base/baseCommand.js");

module.exports = class RemoveNote extends BaseCommand {
	constructor(client) {
		super(client, {
			name: "removenote",
			group: "notes",
			description: "Remove a note from a specified user.",
			clientPermissions: ["SEND_MESSAGES", "EMBED_LINKS"],
			userPermissions: ["ADMINISTRATOR"],
			args: [
				{
					key: "user",
					prompt: "User to remove the note from.",
					type: "user"
				},
				{
					key: "number",
					prompt: "Number of the note to be removed.",
					type: "integer",
					default: "1",
					validate: v => Number.isSafeInteger(Number(v)) && Number(v) > 0
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
			return ctx.embed({ description: `No notes found on ${ctx.args.user.tag}` });
		if (Number(ctx.args.number) > notes.length)
			return ctx.embed({ description: "Invalid note number specified." });
		const noteEntry = notes[targetUserId][ctx.args.number - 1];
		notes[targetUserId].splice(ctx.args.number - 1, 1);
		ctx.guildStorage.set("notes", notes);
		ctx.embed({
			title: `Note successfully removed from ${ctx.args.user.tag}`,
			fields: [
				{ name: `${ctx.client.users.cache.has(noteEntry.addedBy) ? ctx.client.users.cache.get(noteEntry.addedBy).tag : noteEntry.addedBy} on ${this.generateCompactTimeString(noteEntry.timestamp)}`, value: noteEntry.note, inline: false }
			],
			thumbnail: { url: ctx.args.user.displayAvatarURL({ format: "png", dynamic: true, size: 1024 }) }
		}
		);
	}
};