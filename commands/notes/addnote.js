const BaseCommand = require("../../src/base/baseCommand.js");

module.exports = class AddNote extends BaseCommand {
	constructor(client) {
		super(client, {
			name: "addnote",
			group: "notes",
			description: "Add a note for a specified user.",
			clientPermissions: ["SEND_MESSAGES", "EMBED_LINKS"],
			userPermissions: ["ADMINISTRATOR"],
			args: [
				{
					key: "user",
					prompt: "User to add the note on.",
					type: "user"
				},
				{
					key: "note",
					prompt: "Note to be added.",
					type: "string",
					validate: v => v.length && v.length < 1000
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
		const noteEntry = { timestamp: Date.now(), addedBy: ctx.user.id, note: ctx.args.note };
		notes[targetUserId].push(noteEntry);
		ctx.guildStorage.set("notes", notes);
		ctx.embed({
			title: `Note successfully added on ${ctx.args.user.tag}`,
			fields: [
				{ name: `${ctx.user.tag} on ${this.generateCompactTimeString(noteEntry.timestamp)}`, value: ctx.args.note, inline: false }
			],
			thumbnail: { url: ctx.args.user.displayAvatarURL({ format: "png", dynamic: true, size: 1024 }) }
		});
	}
};