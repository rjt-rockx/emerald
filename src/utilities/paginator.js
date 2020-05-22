const { MessageEmbed } = require("discord.js");
const { Util: { splitMessage, resolveString } } = require("discord.js");

const chunk = (arrayLike, size) => arrayLike.length === 0 ? [] : [arrayLike.slice(0, size)].concat(chunk(arrayLike.slice(size), size));

module.exports = class Paginator {
	constructor(ctx, fields, options) {
		this.back = "◀";
		this.next = "▶";
		this.stop = "⏹";
		this.member = ctx.member;
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
			options.defaultPage = 0;
		this.current = options.defaultPage;
		this.fields = chunk(this.fields, options.chunkSize);
		this.total = this.fields.length;
		this.embedTemplate = typeof options.embedTemplate === "object" ? options.embedTemplate : {};

		ctx.channel.send(new MessageEmbed({
			...this.embedTemplate,
			fields: this.fields[this.current],
			footer: this.footer
		})).then(async msg => {
			this.message = msg;
			if (this.message.partial) await this.message.fetch().catch(() => { });
			if (this.total < 2) return;
			await this.message.react(this.back);
			await this.message.react(this.next);
			if (this.total > 2) await this.message.react(this.stop);
			this.collector = this.message.createReactionCollector((reaction, user) => reaction.me && user.id === this.member.id && user.id !== this.message.author.id, { time: this.timeout * 1000 });

			const paginate = async reaction => {
				if (reaction.partial) await reaction.fetch().catch(() => { });
				switch (reaction.emoji.toString()) {
					case this.back: {
						this.current--;
						if (this.current < 0) this.current = this.total - 1;
						reaction.users.remove(ctx.member).catch(() => { });
						break;
					}
					case this.next: {
						this.current++;
						if (this.current > this.total - 1) this.current = 0;
						reaction.users.remove(ctx.member).catch(() => { });
						break;
					}
					case this.stop: {
						this.collector.stop();
						break;
					}
				}
				this.refresh();
			};

			this.collector.on("collect", paginate);
			this.collector.on("remove", paginate);

			this.collector.on("end", () => this.message.reactions.removeAll().catch(() => { }));
		});
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
			const splitFields = this.splitText(longField.value, { maxLength: lengths.value }).map(value => ({ name: longField.name, value, inline: !!longField.inline }));
			newFields.splice(longField.index, 1, ...splitFields);
		}
		if (newFields.length && newFields.length < 2) {
			newFields[0].name = (newFields[0].name.length > lengths.name ? newFields[0].name.substring(0, lengths.name - 3) : newFields[0].name) + "...";
		}
		else if (newFields.length === 2) {
			const continueString = "... (contd.)";
			newFields[1].name = (newFields[1].name.length > lengths.name ? newFields[1].name.substring(0, lengths.name - continueString.length) : newFields[1].name) + "... (contd.)";
		}
		else if (newFields.length > 2) {
			newFields = newFields.map((field, splitIndex) => {
				if (splitIndex) {
					const continueString = `... (contd.${splitIndex > 1 ? ` - ${splitIndex}` : ""})`;
					field.name = (field.name > lengths.name ? field.name.substring(0, lengths.name - continueString.length) : field.name) + continueString;
				}
				return field;
			});
		}
		return newFields;
	}

	refresh() {
		this.message.edit(new MessageEmbed({ ...this.embedTemplate, fields: this.fields[this.current], footer: this.footer }));
		this.collector.resetTimer({ idle: this.timeout * 1000 });
	}

	get footer() {
		return { text: `Page ${this.current + 1} of ${this.total}` };
	}
};
