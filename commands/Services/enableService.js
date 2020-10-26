
const BaseCommand = require("../../src/base/baseCommand.js");

module.exports = class EnableService extends BaseCommand {
	constructor(client) {
		super(client, {
			name: "enableservice",
			description: "Enable a service.",
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

	async task(ctx) {
		const service = ctx.args.service;
		service.enable();
		return ctx.embed({ description: `Successfully enabled ${service.name} service.` });
	}
};
