const { ArgumentType } = require("discord.js-commando");

class ServiceArgumentType extends ArgumentType {
	constructor(client) {
		super(client, "service");
	}

	validate(val) {
		if (!this.client.serviceHandler)
			return false;
		const services = this.client.serviceHandler.listServices();
		if (services.some(service => val.toLowerCase() === service.name.toLowerCase() || val.toLowerCase() === service.id.toLowerCase()))
			return true;
		return false;
	}

	parse(val) {
		if (!this.client.serviceHandler)
			return null;
		const serviceByName = this.client.serviceHandler.listServices().find(service => val.toLowerCase() === service.name.toLowerCase());
		if (serviceByName)
			return this.client.serviceHandler.getService(serviceByName.id);
		const serviceByID = this.client.serviceHandler.listServices().find(service => val.toLowerCase() === service.id.toLowerCase());
		if (serviceByID)
			return this.client.serviceHandler.getService(serviceByID.id);
		return null;
	}
}

module.exports = ServiceArgumentType;