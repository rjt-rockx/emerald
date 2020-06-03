const { Command } = require("discord.js-commando");
const { toTitleCase } = require("../utilities/utilities.js");

module.exports = class BaseCommand extends Command {
	constructor(client, commandInfo) {
		super(client, {
			...commandInfo,
			memberName: commandInfo.memberName || commandInfo.name
		});
		if (this.argsCollector)
			this.argsCollector.promptLimit = 0;
	}

	getReadablePermission(ctx, permission) {
		const enabledText = permission.enabled ? "`Enabled `" : "`Disabled`";
		const reasons = {
			"global": () => `${enabledText} **globally**`,
			"guild": id => ctx.guild ? ctx.guild.id === id && `${enabledText} in **this server**` : `${enabledText} in the **${ctx.client.guilds.cache.get(id).name}** server`,
			"category-channel": id => `${enabledText} in the **${ctx.guild.channels.cache.get(id).name}** category`,
			"text-channel": id => `${enabledText} in the **#${ctx.guild.channels.cache.get(id).name}** channel`,
			"voice-channel": id => `${enabledText} in the **${ctx.guild.channels.cache.get(id).name}** voice channel`,
			"role": id => `${enabledText} for the **${ctx.guild.roles.cache.get(id).name}** role`,
			"user": id => `${enabledText} for **${ctx.client.users.cache.get(id).tag}**`
		};
		return reasons[permission.type](permission.id);
	}

	getReadableMissingPermission(ctx, missingPermission) {
		const reasons = {
			"global": () => " as this command is disabled globally.",
			"guild": () => " in this server.",
			"category-channel": id => ` in the ${ctx.guild.channels.cache.get(id).name} category.`,
			"text-channel": id => ` in the #${ctx.guild.channels.cache.get(id).name} channel.`,
			"voice-channel": id => ` in the ${ctx.guild.channels.cache.get(id).name} voice channel.`,
			"role": id => ` with the ${ctx.guild.roles.cache.get(id).name} role.`,
			"user": () => "."
		};
		return `You are not allowed use this command${reasons[missingPermission.type](missingPermission.id)}`;
	}

	onBlock(ctx) {
		if (typeof super.onBlock !== "undefined") {
			const result = super.onBlock(ctx.message, ctx.reason, ctx.blockData);
			if (!result) {
				if (["globalCommandPermissions", "guildCommandPermissions"].includes(ctx.reason)) {
					const { blockData: commandPermissions } = ctx;
					const missingPermission = commandPermissions.global.blockReason || commandPermissions.guild.blockReason;
					if (!missingPermission) return;
					const readableMissingPerm = this.getReadableMissingPermission(ctx, missingPermission);
					return ctx.embed({ description: readableMissingPerm });
				}
			}
			return result;
		}
	}

	onError(ctx) {
		if (typeof super.onError !== "undefined") {
			const result = super.onError(ctx.error, ctx.message, ctx.args, ctx.fromPattern);
			return result;
		}
	}

	onCancel(ctx) {
		if (typeof super.onCancel !== "undefined") {
			const result = super.onCancel(ctx.command, ctx.reason, ctx.message, ctx.collectedArgs);
			return result;
		}
		if (!ctx.collectedArgs.values || (Array.isArray(ctx.collectedArgs.values) && !ctx.collectedArgs.values.length))
			return ctx.embed({ description: "No arguments specified." });
		else if (ctx.collectedArgs.values && ctx.collectedArgs.values.length && ctx.collectedArgs.cancelledArg) {
			const { cancelledArg, cancelledValue } = ctx.collectedArgs;
			let type;
			if (cancelledArg.type.id.includes("|"))
				type = cancelledArg.type.id.split("|").map(id => id.split("-").join(" ")).map(t => `\`${toTitleCase(t)}\``);
			if (cancelledArg.type.id === "string" && cancelledArg.oneOf && cancelledArg.oneOf.length)
				type = cancelledArg.oneOf.map(item => typeof item === "string" ? `\`${item}\`` : item);
			if (!type)
				type = cancelledArg.type.id.split("-").join(" ");
			let cancelString = cancelledValue ? `Could not parse ${cancelledValue} as ${["a", "e", "i", "o", "u"].includes(cancelledArg.key[0]) ? "an" : "a"} ${cancelledArg.key}. ` : `No ${cancelledArg.key} specified. `;
			if (type !== cancelledArg.key) {
				const typeString = Array.isArray(type) ? `one of these? \n${type.join(", ")}` : `a ${type}?`;
				cancelString += `\nDid you mean to specify ${typeString}`;
			}
			return ctx.embed({ description: cancelString });
		}
	}
};