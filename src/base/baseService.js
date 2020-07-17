module.exports = class baseService {
	constructor(client, serviceInfo = {}) {
		this.client = client;
		this._name = serviceInfo.name ? serviceInfo.name : this.constructor.name;
		this._description = serviceInfo.description ? serviceInfo.description : "No description specified.";
		this.enabled = typeof serviceInfo.enabled === "boolean" ? serviceInfo.enabled : true;
		this.fetchPartials = !!serviceInfo.fetchPartials;
		this.guildOnly = !!serviceInfo.guildOnly;
	}

	get handler() {
		return this.client.serviceHandler;
	}

	get id() {
		return this.constructor.name.toLowerCase();
	}

	get name() {
		return this._name;
	}

	get description() {
		return this._description;
	}

	enable() {
		this.enabled = true;
		return this;
	}

	disable() {
		this.enabled = false;
		return this;
	}
};