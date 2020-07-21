
const BaseCommand = require("../../src/base/baseCommand.js");

module.exports = class XPOptions extends BaseCommand {
	constructor(client) {
		super(client, {
			name: "xproleoptions",
			description: "Configure options for XP role rewards.",
			group: "xp",
			aliases: ["xpropts"],
			clientPermissions: ["SEND_MESSAGES", "EMBED_LINKS"],
			userPermissions: ["MANAGE_GUILD"],
			args: [
				{
					key: "option",
					prompt: "XP option to set",
					type: "string",
					oneOf: ["persistent", "stack"]
				},
				{
					key: "value",
					prompt: "Value to set for the option",
					type: "boolean",
					default: ""
				}
			]
		});
	}

	async task(ctx) {
		const xpRoleOptions = ctx.guildStorage.get("xpRoleOptions") || ctx.guildStorage.set("xpRoleOptions", {});
		xpRoleOptions[ctx.args.option] = typeof ctx.args.value === "string" ? !xpRoleOptions[ctx.args.option] : ctx.args.value;
		ctx.guildStorage.set("xpRoleOptions", xpRoleOptions);
		return ctx.embed("XP Role options successfully updated.");
	}
};
