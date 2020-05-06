const BaseCommand = require("../../src/base/baseCommand.js");
const Paginator = require("../../src/paginator.js");
const toTitleCase = str => str.replace(/\w\S*/g, txt => txt.charAt(0).toUpperCase() + txt.substr(1));

module.exports = class ListCmdPerms extends BaseCommand {
	constructor(client) {
		super(client, {
			name: "listcmdperms",
			group: "permissions",
			aliases: ["listcommandpermissions", "listcmdpermissions", "listcommandperms"],
			description: "List permissions set for a specific command.",
			clientPermissions: ["SEND_MESSAGES", "EMBED_LINKS"],
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

	getReadablePermission(ctx, permission) {
		const enabledText = permission.enabled ? "` enabled`" : "`disabled`";
		const reasons = {
			"global": () => `${enabledText} **globally**`,
			"guild": id => ctx.guild ? ctx.guild.id === id && `${enabledText} for **this server**` : `${enabledText} for the **${ctx.client.guilds.cache.get(id).name}** server`,
			"category-channel": id => `${enabledText} for the **${ctx.guild.channels.cache.get(id).name}** category`,
			"text-channel": id => `${enabledText} for the **#${ctx.guild.channels.cache.get(id).name}** channel`,
			"voice-channel": id => `${enabledText} for the **${ctx.guild.channels.cache.get(id).name}** voice channel`,
			"role": id => `${enabledText} for the **${ctx.guild.roles.cache.get(id).name}** role`,
			"user": id => `${enabledText} for **${ctx.client.users.cache.get(id).tag}**`
		};
		return reasons[permission.type](permission.id);
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
		return new Paginator(ctx, readablePermFields, 30, { splitLongFields: true, embedTemplate: { title: `Command permissions for ${ctx.args.command.name}` } });
	}
};