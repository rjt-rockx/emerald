const { Role } = require("discord.js");
const BaseCommand = require("../../src/base/baseCommand.js");

module.exports = class ApproverRole extends BaseCommand {
	constructor(client) {
		super(client, {
			name: "approverrole",
			description: "Get, set or remove an approver role. Applications can only be approved by people with this role.",
			group: "applications",
			userPermissions: ["ADMINISTRATOR"],
			clientPermissions: ["SEND_MESSAGES", "EMBED_LINKS"],
			args: [
				{
					key: "action",
					prompt: "Get, set or remove the approver role for this guild.",
					type: "string",
					oneOf: ["get", "set", "remove"]
				},
				{
					key: "role",
					prompt: "Role to allow application approvals for.",
					type: "role",
					default: "none"
				}
			]
		});
	}

	async task(ctx) {
		const approverRole = ctx.guildStorage.get("approverRole");
		if (ctx.args.action === "set") {
			if (!(ctx.args.role instanceof Role))
				return ctx.embed({ description: "Invalid role specified." });
			ctx.guildStorage.set("approverRole", ctx.args.role.id);
			ctx.embed({ description: `Approver role successfully set to ${ctx.args.role.name}.` });
		}
		else if (ctx.args.action === "get") {
			if (!approverRole)
				ctx.embed({ description: "No approver role set." });
			else if (!(await ctx.guild.roles.fetch(approverRole).catch(() => {}))) {
				ctx.guildStorage.delete("approverRole");
				ctx.embed({ description: "Approver role not found." });
			}
			else ctx.embed({ description: `Approver role currently set to ${ctx.guild.roles.cache.get(approverRole).name}.` });
		}
		else if (ctx.args.action === "remove") {
			ctx.guildStorage.delete("approverRole");
			ctx.embed({ description: "Approver role successfully removed." });
		}
	}
};