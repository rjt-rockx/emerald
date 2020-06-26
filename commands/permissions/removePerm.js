const BaseCommand = require("../../src/base/baseCommand.js");

module.exports = class RemovePerm extends BaseCommand {
	constructor(client) {
		super(client, {
			name: "removeperm",
			group: "permissions",
			aliases: ["removeperms", "removecmdperm", "removecmdpermission", "removecommandpermission", "remcmdperm", "remcmdpermission", "remcommandpermission", "removecommandperm"],
			description: "Remove a command's permission.",
			clientPermissions: ["SEND_MESSAGES", "EMBED_LINKS"],
			userPermissions: ["MANAGE_GUILD"],
			guarded: true,
			args: [
				{
					key: "command",
					prompt: "Command to remove a permission from",
					type: "command"
				},
				{
					key: "perms",
					prompt: "Permission numbers to remove",
					type: "integer|string",
					default: 1
				}
			]
		});
	}

	async task(ctx) {
		const commandPermissions = ctx.guildStorage.get("commandPermissions");
		if (!commandPermissions.length || !commandPermissions.some(permEntry => permEntry.command && permEntry.command === ctx.args.command.name))
			return ctx.embed({ description: "No permissions set for this command." });
		const currentCmd = commandPermissions.find(permEntry => permEntry.command === ctx.args.command.name);
		if (ctx.args.perms === "all") {
			const removedPerms = currentCmd.permissions.map(permission => this.getReadablePermission(ctx, permission))
				.filter(p => !!p)
				.map((v, i, { length: digits }) => `\`${String(i + 1).padStart(String(digits).length)}.\` ${v}`)
				.join("\n");
			ctx.guildStorage.set("commandPermissions", commandPermissions.map(permEntry => {
				if (permEntry.command && permEntry.command === ctx.args.command.name)
					permEntry.permissions = [];
				return permEntry;
			}));
			return ctx.paginate(
				[{ name: "Removed permissions", value: removedPerms }],
				{
					splitLongFields: true,
					embedTemplate: { title: `All permissions removed for ${ctx.args.command.name}` }
				});
		}
		else if (!ctx.args.perms || !Number.isSafeInteger(ctx.args.perms) || ctx.args.perms > currentCmd.permissions.length)
			return ctx.embed({ description: "Invalid permission number specified." });
		const [permissionToRemove] = currentCmd.permissions.splice(ctx.args.perms - 1, 1);
		ctx.guildStorage.set("commandPermissions", commandPermissions.map(permEntry => {
			if (permEntry.command && permEntry.command === ctx.args.command.name)
				permEntry.permissions = currentCmd.permissions;
			return permEntry;
		}));
		return ctx.embed({
			title: `Command permission removed for ${ctx.args.command.name}`,
			description: `${ctx.args.perms}. ${this.getReadablePermission(ctx, permissionToRemove)}`
		});
	}
};