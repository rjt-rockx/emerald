const { MessageEmbed } = require("discord.js");
const { Util: { splitMessage } } = require("discord.js");

const chunk = (arrayLike, size) => arrayLike.length === 0 ? [] : [arrayLike.slice(0, size)].concat(chunk(arrayLike.slice(size), size));

module.exports = class Paginator {
	constructor(ctx, fields, options) {
		this.back = "◀";
		this.next = "▶";
		this.stop = "⏹";
		this.timeout = options.timeout && Number.isSafeInteger(options.timeout) && options.timeout <= 300 && options.timeout > 0 ? options.timeout : 15;
		this.member = ctx.member;
		if (!options) options = {};
		if (options.numberFields)
			fields = fields.map((field, index) => ({ ...field, name: `${index + 1}. ${field.name}` }));
		if (options.splitLongFields)
			fields = this.splitLongFields(fields);
		if (typeof options.chunkSize !== "number" || options.chunkSize < 1 || options.chunkSize > 12)
			options.chunkSize = 5;
		if (typeof options.defaultPage !== "number" || !(options.defaultPage >= 0 && options.defaultPage <= fields.length))
			options.defaultPage = 0;
		this.current = options.defaultPage;
		this.fields = chunk(fields, options.chunkSize);
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

	splitLongFields(fields) {
		const longFields = fields.map((field, index) => ({ ...field, long: field.value.length > 1024, index })).filter(field => field.long && field.index);
		for (const longField of longFields) {
			let splitFields = splitMessage(longField.value, { maxLength: 1024 }).map(value => ({ name: longField.name, value }));
			if (splitFields.length === 2)
				splitFields[1].name = (splitFields[1].name > 256 ? splitFields[1].name.substring(0, 244) : splitFields[1].name) + "... (contd.)";
			else if (splitFields.length > 2) {
				splitFields = splitFields.map((field, splitIndex) => {
					if (splitIndex) {
						const continueString = `... (contd.${splitIndex > 1 ? ` - ${splitIndex}` : ""})`;
						field.name = (field.name > 256 ? field.name.substring(0, 256 - continueString.length) : splitFields[1].name) + continueString;
					}
					return field;
				});
			}
			fields = fields.splice(longField.index, 1, ...splitFields);
		}
		return fields;
	}

	refresh() {
		this.message.edit(new MessageEmbed({ ...this.embedTemplate, fields: this.fields[this.current], footer: this.footer }));
		this.collector.resetTimer({ idle: this.timeout * 1000 });
	}

	get footer() {
		return { text: `Page ${this.current + 1} of ${this.total}` };
	}
};
