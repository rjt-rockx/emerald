const { readdirSync } = require("fs"), { join, resolve } = require("path").win32;
const onText = str => str.replace(/\w\S*/g, txt => "on" + txt.charAt(0).toUpperCase() + txt.substr(1));
const everyText = str => str.replace(/\w\S*/g, txt => "every" + txt.charAt(0).toUpperCase() + txt.substr(1));
const deepProps = x => x && x !== Object.prototype && Object.getOwnPropertyNames(x).concat(deepProps(Object.getPrototypeOf(x)) || []);
const deepFunctions = x => deepProps(x).filter(name => typeof x[name] === "function");
const userFunctions = x => new Set(deepFunctions(x).filter(name => name !== "constructor" && !~name.indexOf("__")));

const BaseService = require("../base/baseService.js");

const intervals = {
	minute: 60,
	fiveMinutes: 300,
	fifteenMinutes: 900,
	halfAnHour: 1800,
	hour: 3600,
	day: 86400
};

class ServiceHandler {
	async initialize(client) {
		this.client = client;
		this.services = [];
		this.events = [
			"raw",
			"channelCreate",
			"channelDelete",
			"channelPinsUpdate",
			"channelUpdate",
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
			"commandMessage",
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
		this.addServicesIn("../../services");
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
			if (filename.endsWith(".js") && !filename.endsWith("index.js")) { // use string methods rather than regex for performance
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
		const serviceListeners = [...userFunctions(service)];
		return this.events.filter(event => serviceListeners.includes(onText(event)) || serviceListeners.includes(everyText(event)));
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
		for (const service of this.services)
			if (typeof service[onText(event)] === "function" && service.enabled) {
				const context = await this.client.context[event](...args);
				if (typeof context !== "undefined")
					service[onText(event)](context);
			}
	}

	async runTimedEvent(event, args) {
		for (const service of this.services) {
			if (typeof service[everyText(event)] === "function" && service.enabled) {
				const context = await this.client.context.timedEvent(...args);
				if (typeof context !== "undefined")
					service[everyText(event)](context);
			}
		}
	}

	registerClientEvents() {
		this.usedEvents = this.services.reduce((events, service) => events.concat([...userFunctions(service)]), [])
			.filter(eventName => eventName.startsWith("on") || eventName.startsWith("every"))
			.sort().filter((eventName, index, self) => self.indexOf(eventName) === index);
		this.clientEvents = this.events.filter(event => this.usedEvents.includes(onText(event)));
		for (const event of this.clientEvents)
			this.client.on(event, (...args) => this.runClientEvent(event, args));
	}

	registerTimedEvents() {
		this.timedEvents = Object.keys(intervals).filter(interval => this.usedEvents.includes(everyText(interval)));
		for (const event of this.timedEvents)
			setInterval(() => this.runTimedEvent(event, []), intervals[event] * 1000);
	}
}

module.exports = new ServiceHandler();