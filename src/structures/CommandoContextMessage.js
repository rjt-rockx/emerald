module.exports = {
	type: "Message",
	extender: Message => class CommandoContextMessage extends Message {
		constructor(...args) {
			super(...args);
		}

		async obtainArguments(args, provided, promptLimit = 0) {
			this.client.dispatcher._awaiting.add(this.author.id + this.channel.id);
			const values = {};
			const results = [];

			try {
				for (let i = 0; i < args.length; i++) {
					/* eslint-disable no-await-in-loop */
					const arg = args[i];
					const providedValue = arg.infinite ? provided.slice(i) : provided[i];
					const result = await arg.obtain(this, providedValue, promptLimit);
					results.push(result);

					if (result.cancelled) {
						this.client.dispatcher._awaiting.delete(this.author.id + this.channel.id);
						return {
							values: results,
							cancelled: result.cancelled,
							cancelledArg: arg,
							cancelledValue: providedValue,
							prompts: [].concat(...results.map(res => res.prompts)),
							answers: [].concat(...results.map(res => res.answers))
						};
					}

					values[arg.key] = result.value;
					/* eslint-enable no-await-in-loop */
				}
			} catch (err) {
				this.client.dispatcher._awaiting.delete(this.author.id + this.channel.id);
				throw err;
			}

			this.client.dispatcher._awaiting.delete(this.author.id + this.channel.id);
			return {
				values,
				cancelled: null,
				prompts: [].concat(...results.map(res => res.prompts)),
				answers: [].concat(...results.map(res => res.answers))
			};
		}

		async run() {
			const messageContext = await this.client.contextGenerator.message(this).fetchPartials();

			// fetch and cache member
			if (!this.member && !messageContext.member)
				await this.guild.members.fetch(messageContext.author);

			// check guildOnly
			if (this.command.guildOnly && !this.guild) {
				this.client.emit("commandBlock", this, "guildOnly");
				const blockContext = this.client.contextGenerator.commandBlock(this, "guildOnly");
				return this.command.onBlock(blockContext);
			}

			// check nsfw
			if (this.command.nsfw && !this.channel.nsfw) {
				this.client.emit("commandBlock", this, "nsfw");
				const blockContext = this.client.contextGenerator.commandBlock(this, "nsfw");
				return this.command.onBlock(blockContext);
			}

			// check userPermissions
			const hasPermission = this.command.hasPermission(this);
			if (!hasPermission || typeof hasPermission === "string") {
				const data = { response: typeof hasPermission === "string" ? hasPermission : undefined };
				this.client.emit("commandBlock", this, "userPermissions", data);
				const blockContext = this.client.contextGenerator.commandBlock(this, "userPermissions", data);
				return this.command.onBlock(blockContext);
			}

			// check clientPermissions
			if (this.channel.type === "text" && this.command.clientPermissions) {
				const missing = this.channel.permissionsFor(this.client.user).missing(this.command.clientPermissions);
				if (missing.length > 0) {
					const data = { missing };
					this.client.emit("commandBlock", this, "clientPermissions", data);
					const blockContext = this.client.contextGenerator.commandBlock(this, "clientPermissions", data);
					return this.command.onBlock(blockContext);
				}
			}

			const commandPermissions = {};
			// check globalCommandPermissions
			commandPermissions.global = this.checkGlobalCommandPermissions(messageContext, this.command.name);
			if (!commandPermissions.global.permitted) {
				this.client.emit("commandBlock", this, "globalCommandPermissions", commandPermissions);
				const blockContext = this.client.contextGenerator.commandBlock(this, "globalCommandPermissions", commandPermissions);
				return this.command.onBlock(blockContext);
			}

			// check guildCommandPermissions
			if (this.guild) {
				commandPermissions.guild = this.checkGuildCommandPermissions(messageContext, this.command.name);
				if (!commandPermissions.guild.permitted) {
					this.client.emit("commandBlock", this, "guildCommandPermissions", commandPermissions);
					const blockContext = this.client.contextGenerator.commandBlock(this, "guildCommandPermissions", commandPermissions);
					return this.command.onBlock(blockContext);
				}
			}

			// throttles
			const throttle = this.command.throttle(this.author.id);
			if (throttle && throttle.usages + 1 > this.command.throttling.usages) {
				const remaining = (throttle.start + (this.command.throttling.duration * 1000) - Date.now()) / 1000;
				const data = { throttle, remaining };
				this.client.emit("commandBlock", this, "throttling", data);
				const blockContext = this.client.contextGenerator.commandBlock(this, "throttling", data);
				return this.command.onBlock(blockContext);
			}

			// argument parsing
			let args = this.patternMatches;
			let collResult = null;
			if (!args && this.command.argsCollector) {
				const collArgs = this.command.argsCollector.args;
				const count = collArgs[collArgs.length - 1].infinite ? Infinity : collArgs.length;
				const provided = this.constructor.parseArgs(this.argString.trim(), count, this.command.argsSingleQuotes);
				collResult = await this.obtainArguments(collArgs, provided);

				if (collResult.cancelled) {
					this.client.emit("commandCancel", this.command, collResult.cancelled, this, collResult);
					const cancelContext = this.client.contextGenerator.commandCancel(this.command, collResult.cancelled, this, collResult);
					return this.command.onCancel(cancelContext);
				}
				args = collResult.values;
			}

			// get pattern matches
			if (!args) args = this.parseArgs();
			const fromPattern = Boolean(this.patternMatches);

			// add throttle usages
			if (throttle) throttle.usages++;
			const typingCount = this.channel.typingCount;

			// execute the command
			try {
				this.client.emit("debug", `Running command ${this.command.groupID}:${this.command.memberName}.`);
				const commandContext = await this.client.contextGenerator.commandMessage(this, args, fromPattern, collResult).fetchPartials();
				const commandResult = await this.command.task(commandContext);

				this.client.emit("commandRun", this.command, commandResult, this, args, fromPattern, collResult);
			} catch (err) {
				this.client.emit("commandError", this.command, err, this, args, fromPattern, collResult);
				if (this.channel.typingCount > typingCount)
					this.channel.stopTyping();
				const errorContext = this.client.contextGenerator.commandError(err, this, args, fromPattern, collResult);
				return this.command.onError(errorContext);
			}
		}

		checkGuildCommandPermissions(ctx, commandName) {
			let commandPermissions = [];
			if (ctx.guildStorage.has("commandPermissions"))
				commandPermissions = ctx.guildStorage.get("commandPermissions");
			else ctx.guildStorage.set("commandPermissions", []);
			return this.checkCommandPermissions(ctx, commandName, commandPermissions);
		}

		checkGlobalCommandPermissions(ctx, commandName) {
			let commandPermissions = [];
			if (ctx.globalStorage.has("commandPermissions"))
				commandPermissions = ctx.globalStorage.get("commandPermissions");
			else ctx.globalStorage.set("commandPermissions", []);
			return this.checkCommandPermissions(ctx, commandName, commandPermissions);
		}

		checkCommandPermissions(ctx, commandName, commandPermissions) {
			let permitted = true, blockReason = {};
			const currentCommand = commandPermissions.find(permission => permission.command && permission.command === commandName);
			if (!currentCommand || this.guarded) return { permitted };
			for (const { type, id, enabled } of currentCommand.permissions) {
				if (this.matchesConditions(ctx, type, id)) {
					if (!enabled) blockReason = { type, id };
					permitted = enabled;
				}
			}
			return { permitted, blockReason };
		}

		matchesConditions(ctx, type, id) {
			if (type === "global") return true;
			if (type === "guild" && ctx.guild.id === id) return true;
			if (type === "category-channel" && ctx.channel.parentID && ctx.channel.parentID === id) return true;
			if (type === "text-channel" && ctx.channel.id === id) return true;
			if (type === "voice-channel" && ctx.member.voice.channelID && ctx.member.voice.channelID === id) return true;
			if (type === "role" && ctx.member.roles.cache.has(id)) return true;
			if (type === "user" && ctx.user.id === id) return true;
			return false;
		}
	}
};
