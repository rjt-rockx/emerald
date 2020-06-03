const { readdirSync } = require("fs");
const { join, resolve } = require("path");
const { onText, everyText, userFunctions } = require("../utilities/utilities.js");

const BaseService = require("../base/baseService.js");

class ServiceHandler {
	async initialize(client) {
		this.client = client;
		this.services = [];
		this.intervals = {
			minute: 60,
			fiveMinutes: 300,
			fifteenMinutes: 900,
			halfAnHour: 1800,
			hour: 3600,
			day: 86400
		};
		this.clientEvents = [
			"raw",
			"channelCreate",
			"channelDelete",
			"channelPinsUpdate",
			"channelUpdate",
			"commandMessage",
			"commandBlock",
			"commandCancel",
			"commandError",
			"commandPrefixChange",
			"commandRegister",
			"commandReregister",
			"commandRun",
			"commandStatusChange",
			"commandUnregister",
			"debug",
			"warn",
			"emojiCreate",
			"emojiDelete",
			"emojiUpdate",
			"guildBanAdd",
			"guildBanRemove",
			"guildCreate",
			"guildDelete",
			"guildMemberAdd",
			"guildMemberRemove",
			"guildMemberUpdate",
			"inviteCreate",
			"inviteDelete",
			"presenceUpdate",
			"voiceStateUpdate",
			"guildMemberSpeaking",
			"guildUpdate",
			"message",
			"messageDelete",
			"messageReactionRemoveAll",
			"messageDeleteBulk",
			"messageReactionAdd",
			"messageReactionRemove",
			"messageReactionRemoveEmoji",
			"messageUpdate",
			"roleCreate",
			"roleDelete",
			"roleUpdate",
			"typingStart",
			"typingStop",
			"userUpdate",
			"webhookUpdate"
		];
		this.timedEvents = Object.keys(this.intervals);
		this.usedEvents = new Set();
		this.addServicesIn("../../services");
		this.registerUsedEvents();
		this.registerClientEvents();
		this.registerTimedEvents();
		if (!this.client.serviceHandler)
			this.client.serviceHandler = this;
		this.client.services = this.services;
		return this.services;
	}

	checkIfValid(service) {
		return ["function", "object"].includes(typeof service) && service.prototype && service.prototype instanceof BaseService;
	}

	addService(service) {
		if (!this.checkIfValid(service)) return;
		const serviceToAdd = new service(this.client);
		if (this.services.some(existingService => existingService.id === serviceToAdd.id)) return;
		this.services.push(serviceToAdd);
	}

	addServicesIn(folder) {
		for (const filename of readdirSync(resolve(__dirname, folder))) {
			if (filename.endsWith(".js") && !filename.endsWith("index.js")) {
				const service = require(join(folder, filename));
				this.addService(service);
			}
		}
	}

	listServices() {
		return this.services.map(({ id, name, description, enabled }) => ({ id, name, description, enabled }));
	}

	getService(id) {
		return this.services.find(service => service.id === id);
	}

	getServiceEvents(id) {
		const service = this.getService(id);
		if (!service) return;
		return userFunctions(service).filter(listener => this.usedEvents.has(onText(listener)) || this.usedEvents.has(everyText(listener)));
	}

	enableService(id) {
		for (const service of this.services)
			if (service.id === id && !service.enabled)
				service.enable();
	}

	disableService(id) {
		for (const service of this.services)
			if (service.id === id && service.enabled)
				service.disable();
	}

	removeService(service) {
		this.services = this.services.filter(existingService => existingService.id !== service.id);
	}

	removeAllServices() {
		this.services = [];
	}

	async runClientEvent(event, args) {
		const context = this.client.contextGenerator[event](...args);
		this.services
			.filter(service => typeof service[onText(event)] === "function" && service.enabled)
			.forEach(service => {
				if (service.fetchPartials)
					return context.fetchPartials().then(ctx => service[onText(event)](ctx));
				return Promise.resolve(service[onText(event)](context));
			});
	}

	async runTimedEvent(event, args) {
		const context = this.client.contextGenerator.timedEvent(...args);
		this.services
			.filter(service => typeof service[everyText(event)] === "function" && service.enabled)
			.forEach(service => {
				if (service.fetchPartials)
					return context.fetchPartials().then(ctx => service[everyText(event)](ctx));
				return Promise.resolve(service[everyText(event)](context));
			});
	}

	registerUsedEvents() {
		this.services.reduce((events, service) => events.concat(userFunctions(service)), [])
			.filter(eventName => eventName.startsWith("on") || eventName.startsWith("every"))
			.forEach(event => this.usedEvents.add(event));
	}

	registerClientEvents() {
		this.usedClientEvents = this.clientEvents.filter(event => this.usedEvents.has(onText(event)));
		for (const event of this.usedClientEvents)
			this.client.on(event, (...args) => this.runClientEvent(event, args));
	}

	registerTimedEvents() {
		this.usedTimedEvents = this.timedEvents.filter(interval => this.usedEvents.has(everyText(interval)));
		for (const event of this.usedTimedEvents)
			setInterval(() => this.runTimedEvent(event, []), this.intervals[event] * 1000);
	}
}

module.exports = new ServiceHandler();