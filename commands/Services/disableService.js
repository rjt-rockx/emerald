
const BaseCommand = require("../../src/base/baseCommand.js");

module.exports = class DisableService extends BaseCommand {
	constructor(client) {
		super(client, {
			name: "disableservice",
			description: "Disable a service.",
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
		service.disable();
		return ctx.embed({ description: `Successfully disabled ${service.name} service.` });
	}
};
