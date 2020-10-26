const BaseCommand = require("../../src/base/baseCommand.js");
const NadekoConnectorClient = require("../../src/utilities/nadekoConnector.js");

module.exports = class NCSetup extends BaseCommand {
	constructor(client) {
		super(client, {
			name: "ncsetup",
			description: "Sets the NadekoConnector configuration for this guild.",
			group: "nadekoconnector",
			memberName: "ncsetup",
			aliases: ["nadekosetup"],
			userPermissions: ["ADMINISTRATOR"],
			clientPermissions: ["ADMINISTRATOR"],
			args: [
				{
					key: "address",
					prompt: "Address to use for NadekoConnector endpoints.",
					type: "string"
				},
				{
					key: "password",
					prompt: "Password for the NadekoConnector instance.",
					type: "string"
				}
			]
		});
	}

	async task(ctx) {
		if (!ctx.nadekoConnector)
			ctx.guildStorage.set("nadekoconnector", { enabled: false });
		const tryNc = new NadekoConnectorClient(ctx.args.address, ctx.args.password),
			botInfo = await tryNc.getBotInfo();
		if (typeof botInfo.error !== "undefined") {
			return ctx.embed("Unable to connect to the given NadekoConnector instance.");
		}
		if (typeof botInfo.error === "undefined") {
			ctx.guildStorage.set("nadekoconnector", { address: ctx.args.address, password: ctx.args.password, enabled: true });
			return ctx.embed("NadekoConnector configuration stored.");
		}
	}
};