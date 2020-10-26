const BaseCommand = require("../../src/base/baseCommand.js");

module.exports = class EnableService extends BaseCommand {
	constructor(client) {
		super(client, {
			name: "serviceinfo",
			description: "Get information about a service",
			group: "services",
			ownerOnly: true,
			clientPermissions: ["SEND_MESSAGES", "EMBED_LINKS"],
			args: [
				{
					key: "service",
					prompt: "ID or name of the service",
					type: "service"
				}
			]
		});
	}

	getReadableEventName(event) {
		return event
			.replace(/([A-Z])/g, (match) => ` ${match}`)
			.replace(/^./, (match) => match.toUpperCase())
			.trim();
	}

	async task(ctx) {
		const service = ctx.args.service;
		return ctx.embed({
			title: service.name,
			description: service.description,
			fields: [
				{
					name: "Service ID",
					value: service.id,
					inline: true
				},
				{
					name: "Enabled",
					value: service.enabled ? "True" : "False",
					inline: true
				},
				{
					name: "Listened Events",
					value: ctx.client.serviceHandler.getServiceEvents(service.id).map(event => "- " + this.getReadableEventName(event)).join("\n"),
					inline: false
				}
			]
		});
	}
};
