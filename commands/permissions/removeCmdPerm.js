const BaseCommand = require("../../src/base/baseCommand.js");
const Paginator = require("../../src/paginator.js");

module.exports = class RemoveCmdPerm extends BaseCommand {
	constructor(client) {
		super(client, {
			name: "removecmdperm",
			group: "permissions",
			aliases: ["removecmdpermission", "removecommandpermission", "remcmdperm", "remcmdpermission", "remcommandpermission", "removecommandperm"],
			description: "Enable a bot command.",
			clientPermissions: ["SEND_MESSAGES", "EMBED_LINKS"],
			guarded: true,
			args: [
				{
					key: "command",
					prompt: "Command to remove a permission from",
					type: "command"
				},
				{
					key: "permno",
					prompt: "Permission number to remove",
					type: "integer",
					default: 1
				}
			]
		});
	}

	getReadablePermission(ctx, permission) {
		const enabledText = permission.enabled ? "Enable" : "Disable";
		const reasons = {
			"global": () => `${enabledText} ${ctx.args.command.name} **globally**`,
			"guild": id => ctx.guild ? ctx.guild.id === id && `${enabledText} ${ctx.args.command.name} for **this server**` : `${enabledText} for the **${ctx.client.guilds.cache.get(id).name}** server`,
			"category-channel": id => `${enabledText} ${ctx.args.command.name} for the **${ctx.guild.channels.cache.get(id).name}** category`,
			"text-channel": id => `${enabledText} ${ctx.args.command.name} for the **#${ctx.guild.channels.cache.get(id).name}** channel`,
			"voice-channel": id => `${enabledText} ${ctx.args.command.name} for the **${ctx.guild.channels.cache.get(id).name}** voice channel`,
			"role": id => `${enabledText} ${ctx.args.command.name} for the **${ctx.guild.roles.cache.get(id).name}** role`,
			"user": id => `${enabledText} ${ctx.args.command.name} for **${ctx.client.users.cache.get(id).tag}**`
		};
		return reasons[permission.type](permission.id);
	}

	async task(ctx) {
		const commandPermissions = ctx.guildStorage.get("commandPermissions");
		if (!commandPermissions.length || !commandPermissions.some(permEntry => permEntry.command && permEntry.command === ctx.args.command.name))
			return ctx.embed({ description: "No permissions set for this command." });
		const currentCmd = commandPermissions.find(permEntry => permEntry.command === ctx.args.command.name);
		if (!ctx.args.permno || ctx.args.permno > currentCmd.permissions.length)
			return ctx.embed({ description: "Invalid permission number specified." });
		const [permissionToRemove] = currentCmd.permissions.splice(ctx.args.permno - 1, 1);
		ctx.guildStorage.set("commandPermissions", commandPermissions.map(permEntry => {
			if (permEntry.command && permEntry.command === ctx.args.command.name)
				permEntry.permissions = currentCmd.permissions;
			return permEntry;
		}));
		return ctx.embed({ title: "Command permission removed", description: `${ctx.args.permno}. ${this.getReadablePermission(ctx, permissionToRemove)}` });
	}
};