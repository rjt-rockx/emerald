const BaseCommand = require("../../src/base/baseCommand.js");
const Paginator = require("../../src/paginator.js");
const toTitleCase = str => str.replace(/\w\S*/g, txt => txt.charAt(0).toUpperCase() + txt.substr(1));

module.exports = class ListPerms extends BaseCommand {
	constructor(client) {
		super(client, {
			name: "listperms",
			group: "permissions",
			aliases: ["listcmdperms", "listcommandpermissions", "listcmdpermissions", "listcommandperms"],
			description: "List permissions set for a specific command.",
			clientPermissions: ["SEND_MESSAGES", "EMBED_LINKS"],
			userPermissions: ["ADMINISTRATOR"],
			guarded: true,
			args: [
				{
					key: "command",
					prompt: "Command to list permissions for",
					type: "command"
				}
			]
		});
	}

	async task(ctx) {
		const readablePermFields = [];
		for (const type of ["global", "guild"]) {
			const cmdPerms = ctx[`${type}Storage`].has("commandPermissions") ? ctx[`${type}Storage`].get("commandPermissions") : [];
			const { permissions: currentPerms } = cmdPerms.find(entry => entry.command === ctx.args.command.name) || { permissions: [] };
			const readableCurrentPerms = currentPerms.map(permission => this.getReadablePermission(ctx, permission))
				.filter(p => !!p)
				.map((v, i, {length: digits}) => `\`${String(i + 1).padStart(String(digits).length)}.\` ${v}`)
				.join("\n");
			readablePermFields.push({ name: `${toTitleCase(type)} permissions`, value: readableCurrentPerms || "No permissions set." });
		}
		return new Paginator(ctx, readablePermFields, { splitLongFields: true, embedTemplate: { title: `Command permissions for ${ctx.args.command.name}` } });
	}
};