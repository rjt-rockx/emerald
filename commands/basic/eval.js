const { inspect } = require("util"), { splitMessage } = require("discord.js");
const escapeRegex = text => text.replace(/[|\\{}()[\]^$+*?.]/g, "\\$&").replace(/-/g, "\\x2d");
const nlPattern = new RegExp("!!NL!!", "g");
const BaseCommand = require("../../src/base/baseCommand.js");

module.exports = class Eval extends BaseCommand {
	constructor(client) {
		super(client, {
			name: "eval",
			group: "basic",
			description: "Executes JavaScript code.",
			ownerOnly: true,
			args: [
				{
					key: "script",
					prompt: "What code would you like to evaluate?",
					type: "string"
				}
			]
		});
		this.lastResult = null;
		this.timeoutFlag = true;
		this.newTimeout = (seconds = 60) => this.timeoutFlag = true && setTimeout(async () => {
			const existingReaction = this.lastEval.reactions.cache.find(reaction => reaction.me);
			if (existingReaction)
				existingReaction.remove().catch(() => { });
			this.timeoutFlag = false;
		}, seconds * 1000);
		this.registerEditedEvalListener(client);
	}

	async task(ctx) {
		this.currentContext = ctx;
		if (ctx.msg.content.includes("token") || ctx.msg.content.includes("config"))
			return ctx.embed({ description: "Accessing token/config is not allowed." });
		this.reactionsEnabled = ctx.channel.permissionsFor(ctx.client.user).has("ADD_REACTIONS");
		const existingReaction = ctx.message.reactions.cache.find(reaction => reaction.me);
		if (existingReaction)
			existingReaction.remove().catch(() => { });
		if (this.lastEval && this.lastEval.id !== ctx.message.id) {
			const oldReaction = this.lastEval.reactions.cache.find(reaction => reaction.me);
			if (oldReaction)
				oldReaction.remove().catch(() => { });
			this.reusableMessage = null;
		}
		if (this.existingTimeout)
			clearTimeout(this.existingTimeout);
		this.lastEval = ctx.message;
		const lastResult = this.lastResult, lastresult = this.lastResult;
		try {
			this.lastResult = eval(ctx.args.script);
		} catch (err) {
			if (this.reactionsEnabled) ctx.message.react("❌").catch(() => { });
			this.existingTimeout = this.newTimeout();
			const result = splitMessage([
				"```",
				err.stack || err,
				"```"
			].join("\n"), { maxLength: 1900, prepend: "```\n", append: "\n```" });
			return this.sendResult(ctx, result);
		}

		const result = this.makeResultMessages(this.lastResult, ctx.args.script, ctx);
		if (this.reactionsEnabled) ctx.message.react("✅").catch(() => { });
		this.existingTimeout = this.newTimeout();
		return this.sendResult(ctx, result);
	}

	sendReply(val) {
		if (val instanceof Error) {
			if (this.reactionsEnabled) this.currentContext.message.react("❌").catch(() => { });
			this.existingTimeout = this.newTimeout();
			const result = splitMessage([
				"```",
				"Error while evaluating",
				val.stack || val,
				"```"
			].join("\n"), { maxLength: 1900, prepend: "```\n", append: "\n```" });
			return this.sendResult(this.currentContext, result);
		} else {
			if (this.reactionsEnabled) this.currentContext.message.react("✅").catch(() => { });
			const result = this.makeResultMessages(val, null, this.currentContext);
			this.lastResult = val;
			this.existingTimeout = this.newTimeout();
			return this.sendResult(this.currentContext, result);
		}
	}

	makeResultMessages(result, input = null, ctx = this.currentContext) {
		let inspected = inspect(result, { depth: 0 })
			.replace(nlPattern, "\n");
		for (const pattern of this.getSensitivePatterns(ctx)) inspected = inspected.replace(pattern, "[CENSORED]");
		const split = inspected.split("\n");
		const lastInspected = inspected[inspected.length - 1];
		const prependPart = inspected[0] !== "{" && inspected[0] !== "[" && inspected[0] !== "'" ? split[0] : inspected[0];
		const appendPart = lastInspected !== "}" && lastInspected !== "]" && lastInspected !== "'" ? split[split.length - 1] : lastInspected;
		const prepend = `\`\`\`js\n${prependPart}\n`;
		const append = `\n${appendPart}\n\`\`\``;
		if (input) {
			return splitMessage([
				"```js",
				inspected,
				"```"
			].join("\n"), { maxLength: 1900, prepend, append });
		} else {
			return splitMessage([
				"```js",
				inspected,
				"```"
			].join("\n"), { maxLength: 1900, prepend, append });
		}
	}

	async sendResult(ctx = this.currentContext, result) {
		if (result.length < 2) {
			if (this.reusableMessage)
				return this.reusableMessage.edit(result[0]);
			return ctx.send(result[0]).then(m => this.reusableMessage = m);
		}
		if (!this.reusableMessage)
			return result.map(item => ctx.send(item));
		if (this.reusableMessage) {
			const promises = result.map((item, index) => +index < 1 ? this.reusableMessage.edit(item) : ctx.send(item));
			this.reusableMessage = null;
			return promises;
		}
	}

	getSensitivePatterns(ctx = this.currentContext) {
		if (!this._sensitivePattern || !Array.isArray(this._sensitivePattern)) {
			this._sensitivePattern = [];
			if (this.client.token)
				this._sensitivePattern.push(new RegExp(escapeRegex(ctx.client.token), "gi"));
		}
		return this._sensitivePattern;
	}

	registerEditedEvalListener(client) {
		client.on("messageUpdate", (_, newMessage) => {
			if (this.lastEval && newMessage.id === this.lastEval.id && this.timeoutFlag)
				client.dispatcher.handleMessage(newMessage);
		});
	}
};
