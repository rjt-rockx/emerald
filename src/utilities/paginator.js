const { MessageEmbed } = require("discord.js");
const { Util: { splitMessage, resolveString } } = require("discord.js");

module.exports = class Paginator {
	constructor({ channel, user }, fields, options) {
		this.back = "◀";
		this.next = "▶";
		this.stop = "⏹";
		this.user = user;
		this.channel = channel;
		this.fields = fields;
		if (!options) options = {};
		this.timeout = options.timeout && Number.isSafeInteger(options.timeout) && options.timeout <= 300 && options.timeout > 0 ? options.timeout : 15;
		if (options.numberFields)
			this.fields = this.fields.map((field, index) => ({ ...field, name: `${index + 1}. ${field.name}` }));
		if (options.splitLongFields)
			this.fields = this.splitLongFields(this.fields);
		if (typeof options.chunkSize !== "number" || options.chunkSize < 1 || options.chunkSize > 12)
			options.chunkSize = 5;
		if (typeof options.defaultPage !== "number" || !(options.defaultPage >= 0 && options.defaultPage <= fields.length))
			options.defaultPage = 1;
		this.current = options.defaultPage - 1;
		this.fields = Paginator.chunk(this.fields, options.chunkSize);
		this.total = this.fields.length;
		this.embedTemplate = ["object", "function"].includes(typeof options.embedTemplate) ? options.embedTemplate : {};
	}

	static chunk(arrayLike, size) {
		return arrayLike.length === 0 ? [] : [arrayLike.slice(0, size)].concat(this.chunk(arrayLike.slice(size), size));
	}

	async getEmbedTemplate() {
		if (typeof this.embedTemplate === "object")
			return this.embedTemplate;
		if (typeof this.embedTemplate === "function")
			return this.embedTemplate({
				fields: this.fields[this.current],
				current: this.current + 1,
				total: this.total
			});
	}

	async initialize() {
		this.message = await this.channel.send(new MessageEmbed({
			fields: this.fields[this.current],
			footer: this.footer,
			...(await this.getEmbedTemplate())
		}));
		if (this.message.partial)
			await this.message.fetch().catch(() => { });
		if (this.total < 2)
			return;

		await this.message.react(this.back);
		await this.message.react(this.next);

		if (this.total > 2)
			await this.message.react(this.stop);
		this.collector = this.message.createReactionCollector((reaction, user) =>
			reaction.me && user.id === this.user.id && user.id !== this.message.author.id, { time: this.timeout * 1000 });

		const paginate = async reaction => {
			if (reaction.partial)
				await reaction.fetch().catch(() => { });
			switch (reaction.emoji.toString()) {
				case this.back: {
					this.current--;
					if (this.current < 0) this.current = this.total - 1;
					reaction.users.remove(this.user).catch(() => { });
					break;
				}
				case this.next: {
					this.current++;
					if (this.current > this.total - 1) this.current = 0;
					reaction.users.remove(this.user).catch(() => { });
					break;
				}
				case this.stop: {
					this.collector.stop();
					break;
				}
			}
			return this.refresh();
		};

		this.collector.on("collect", paginate);
		this.collector.on("remove", paginate);

		this.collector.on("end", () => this.message.reactions.removeAll().catch(() => { }));

		this.isInitialized = true;
		return this;
	}

	async setPage(page) {
		if (typeof page !== "number" || page < 1 || page > this.total) return;
		if (!this.isInitialized) await this.initialize();
		this.current = page - 1;
		return this.refresh();
	}

	splitText(text, { maxLength = 2000, characters = ["\n", " "], prepend = "", append = "" }) {
		if (!Array.isArray(characters))
			if (characters instanceof String)
				characters = [characters];
		for (const char of characters) {
			try {
				const result = splitMessage(text, { maxLength, char, prepend, append });
				return result;
			}
			catch (err) {
				if (err instanceof RangeError) continue;
				break;
			}
		}
		const resolvedText = resolveString(text);
		const splits = resolvedText.match(new RegExp(`.{1,${maxLength - (prepend.length + append.length)}}`, "g"));
		return splits.map(t => t.trim()).filter(t => !!t).map(t => prepend + t + append);
	}

	splitLongFields(fields, lengths = { name: 256, value: 1024 }) {
		let newFields = fields;
		const longFields = newFields.map((field, index) => ({ ...field, long: field.value.length > lengths.value, index })).filter(field => field.long && (typeof field.index !== "undefined"));
		for (const longField of longFields) {
			let splitFields = this.splitText(longField.value, { maxLength: lengths.value }).map(value => ({ name: longField.name, value, inline: !!longField.inline }));
			if (splitFields.length === 2) {
				const continueString = "... (contd.)";
				splitFields[1].name = (splitFields[1].name.length > lengths.name ? splitFields[1].name.substring(0, lengths.name - continueString.length) : splitFields[1].name) + "... (contd.)";
				splitFields[1].nameEdited = true;
			}
			else if (splitFields.length > 2) {
				splitFields = splitFields.map((field, splitIndex) => {
					if (splitIndex) {
						const continueString = `... (contd.${splitIndex > 1 ? ` - ${splitIndex}` : ""})`;
						field.name = (field.name > lengths.name ? field.name.substring(0, lengths.name - continueString.length) : field.name) + continueString;
						field.nameEdited = true;
					}
					return field;
				});
			}
			newFields.splice(longField.index, 1, ...splitFields);
		}
		newFields = newFields.map(field => {
			const newField = { name: field.name, value: field.value, inline: !!field.inline };
			if (!field.nameEdited && field.name.length > lengths.name)
				newField.name = field.name.substring(0, lengths.name - 3) + "...";
			return newField;
		});
		return newFields;
	}

	async refresh() {
		await this.message.edit(new MessageEmbed({
			fields: this.fields[this.current],
			footer: this.footer,
			...(await this.getEmbedTemplate())
		}));
		this.collector.resetTimer({ idle: this.timeout * 1000 });
		return this;
	}

	get footer() {
		return { text: `Page ${this.current + 1} of ${this.total}` };
	}
};
