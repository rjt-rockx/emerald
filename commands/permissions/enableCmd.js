const BaseCommand = require("../../src/base/baseCommand.js");

module.exports = class EnableCmd extends BaseCommand {
	constructor(client) {
		super(client, {
			name: "enablecmd",
			group: "permissions",
			aliases: ["enablecommand", "ecmd"],
			description: "Enable a bot command.",
			clientPermissions: ["SEND_MESSAGES", "EMBED_LINKS"],
			guarded: true,
			args: [
				{
					key: "command",
					prompt: "Command to enable",
					type: "command",
					default: ""
				},
				{
					key: "type",
					prompt: "Type of target to enable the command for",
					type: "string",
					oneOf: ["server", "guild", "category", "categorychannel", "channel", "text", "textchannel", "vc", "voice", "voicechannel", "role", "user"],
					default: ""
				},
				{
					key: "target",
					prompt: "Target to enable the command for",
					type: "string",
					default: ""
				}
			]
		});
	}

	resolveTarget(ctx, argTypeID) {
		const argType = ctx.client.registry.types.get(argTypeID);
		const value = argType.parse(ctx.args.target, ctx.message);
		if (value && value.id)
			return { type: argTypeID, id: value.id, enabled: true };
		return "";
	}

	addNonDuplicatePermission(commandPermissions, newPermission) {
		return [...commandPermissions.filter(permission => !(permission.type === newPermission.type && permission.id === newPermission.id)), newPermission];
	}

	async task(ctx) {
		if (ctx.args.command === "") return ctx.embed({ description: "Invalid command specified." });
		if (ctx.args.type === "") return ctx.embed({ description: "Invalid type specified." });
		const commandPermissions = ctx.guildStorage.get("commandPermissions");
		let newPerms;
		if (["server", "guild"].includes(ctx.args.type))
			newPerms = { type: "guild", id: ctx.guild.id, enabled: true };
		else if (["category", "categorychannel"].includes(ctx.args.type)) {
			newPerms = this.resolveTarget(ctx, "category-channel");
			if (!newPerms) return ctx.embed({ description: "No such category found." });
		}
		else if (["channel", "text", "textchannel"].includes(ctx.args.type)) {
			newPerms = this.resolveTarget(ctx, "text-channel");
			if (!newPerms) return ctx.embed({ description: "No such text channel found." });
		}
		else if (["vc", "voice", "voicechannel"].includes(ctx.args.type)) {
			newPerms = this.resolveTarget(ctx, "voice-channel");
			if (!newPerms) return ctx.embed({ description: "No such voice channel found." });
		}
		else if (ctx.args.type === "role") {
			newPerms = this.resolveTarget(ctx, "role");
			if (!newPerms) return ctx.embed({ description: "No such role found." });
		}
		else if (ctx.args.type === "user") {
			newPerms = this.resolveTarget(ctx, "user");
			if (!newPerms) return ctx.embed({ description: "No such user found." });
		}
		if (!newPerms)
			return ctx.embed({ description: "Invalid permissions specified." });
		if (!commandPermissions.length || !commandPermissions.some(permEntry => permEntry.command && permEntry.command === ctx.args.command.name)) {
			commandPermissions.push({ command: ctx.args.command.name, permissions: [newPerms] });
			ctx.guildStorage.set("commandPermissions", commandPermissions);
		}
		else ctx.guildStorage.set("commandPermissions", commandPermissions.map(permEntry => {
			if (permEntry.command && permEntry.command === ctx.args.command.name)
				permEntry.permissions = this.addNonDuplicatePermission(permEntry.permissions, newPerms);
			return permEntry;
		}));
		return ctx.embed({ description: "Command permissions updated." });
	}
};