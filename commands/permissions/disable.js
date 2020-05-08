const BaseCommand = require("../../src/base/baseCommand.js");
const { Guild, Role, User, TextChannel, CategoryChannel, VoiceChannel } = require("discord.js");

module.exports = class Disable extends BaseCommand {
	constructor(client) {
		super(client, {
			name: "disable",
			group: "permissions",
			aliases: ["disablecmd", "disablecommand"],
			description: "Disable a bot command.",
			clientPermissions: ["SEND_MESSAGES", "EMBED_LINKS"],
			userPermissions: ["ADMINISTRATOR"],
			guarded: true,
			args: [
				{
					key: "command",
					prompt: "Command to disable",
					type: "command",
					default: ""
				},
				{
					key: "target",
					prompt: "Target to disable the command for",
					type: "contextual|guild|role|user|text-channel|category-channel|voice-channel",
					default: ""
				}
			]
		});
	}

	addNonDuplicatePermission(commandPermissions, newPermission) {
		return [...commandPermissions.filter(permission => !(permission.type === newPermission.type && permission.id === newPermission.id)), newPermission];
	}

	async task(ctx) {
		if (ctx.args.command === "") return ctx.embed({ description: "Invalid command specified." });
		if (ctx.args.type === "") return ctx.embed({ description: "Invalid type specified." });
		const commandPermissions = ctx.guildStorage.get("commandPermissions");
		const newPerms = { id: ctx.args.target.id, enabled: false };
		if (ctx.args.target instanceof Guild)
			newPerms.type = "guild";
		else if (ctx.args.target instanceof Role)
			newPerms.type = "role";
		else if (ctx.args.target instanceof User)
			newPerms.type = "user";
		else if (ctx.args.target instanceof TextChannel)
			newPerms.type = "text-channel";
		else if (ctx.args.target instanceof CategoryChannel)
			newPerms.type = "category-channel";
		else if (ctx.args.target instanceof VoiceChannel)
			newPerms.type = "voice-channel";
		else return ctx.embed({ description: "Invalid permission specified." });
		let permNo = 1;
		if (!commandPermissions.length || !commandPermissions.some(permEntry => permEntry.command && permEntry.command === ctx.args.command.name)) {
			commandPermissions.push({ command: ctx.args.command.name, permissions: [newPerms] });
			ctx.guildStorage.set("commandPermissions", commandPermissions);
		}
		else ctx.guildStorage.set("commandPermissions", commandPermissions.map(permEntry => {
			if (permEntry.command && permEntry.command === ctx.args.command.name)
				permEntry.permissions = this.addNonDuplicatePermission(permEntry.permissions, newPerms);
			permNo = permEntry.permissions.length;
			return permEntry;
		}));
		return ctx.embed({
			title: `Command permissions for ${ctx.args.command.name} updated.`,
			fields: [{ name: "New permission", value: `\`${permNo}.\` ${this.getReadablePermission(ctx, newPerms)}` }]
		});
	}
};