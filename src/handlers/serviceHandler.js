const { readdirSync } = require("fs");
const { join, resolve } = require("path");
const { onText, everyText, userFunctions } = require("../utilities/utilities.js");

const BaseService = require("../base/baseService.js");

class ServiceHandler {
	async initialize(client) {
		this.client = client;
		this.services = {};
		this.intervals = {
			minute: 60,
			fiveMinutes: 300,
			tenMinutes: 600,
			fifteenMinutes: 900,
			halfAnHour: 1800,
			hour: 3600,
			day: 86400
		};
		this.clientEvents = new Set(userFunctions(this.client.contextGenerator));
		this.clientEvents.delete("initialize");
		this.clientEvents.delete("timedEvent");
		this.timedEvents = new Set(Object.keys(this.intervals));
		this.usedEvents = new Set();
		this.addServicesIn("../../services");
		this.registerUsedEvents()
			.registerClientEvents()
			.registerTimedEvents();
		if (!this.client.serviceHandler)
			this.client.serviceHandler = this;
		this.client.services = this.services;
		return Object.values(this.services);
	}

	checkIfValid(service) {
		return ["function", "object"].includes(typeof service) && service.prototype && service.prototype instanceof BaseService;
	}

	addService(service) {
		if (!this.checkIfValid(service)) return;
		const serviceToAdd = new service(this.client);
		if (Object.keys(this.services).includes(serviceToAdd.id))
			return;
		this.services[serviceToAdd.id] = serviceToAdd;

		const serviceEvents = userFunctions(serviceToAdd).filter(listener => this.usedEvents.has(onText(listener)) || this.usedEvents.has(everyText(listener)));
		for (const event of serviceEvents) {
			this.usedEvents.add(event);
			event.startsWith("on") ? this.usedClientEvents.add(event) : this.usedTimedEvents.add(event);
		}
		return serviceToAdd;
	}

	addServicesIn(folder) {
		for (const filename of readdirSync(resolve(__dirname, folder))) {
			if (filename.endsWith(".js") && !filename.endsWith("index.js")) {
				const service = require(join(folder, filename));
				this.addService(service);
			}
		}
		return this;
	}

	listServices() {
		return Object.values(this.services).map(({ id, name, description, enabled }) => ({ id, name, description, enabled }));
	}

	getService(id) {
		return this.services[id];
	}

	getServiceEvents(id) {
		const service = this.getService(id);
		if (!service) return;
		return userFunctions(service).filter(listener => this.usedEvents.has(onText(listener)) || this.usedEvents.has(everyText(listener)));
	}

	enableService(id) {
		const service = this.services[id];
		if (this.checkIfValid(service))
			service.enable();
	}

	disableService(id) {
		const service = this.services[id];
		if (this.checkIfValid(service))
			service.disable();
	}

	removeService(id) {
		delete this.services[id];
	}

	removeAllServices() {
		this.services = {};
	}

	async runClientEvent(event, args) {
		if (!this.usedEvents.has(event))
			return;
		const context = this.client.contextGenerator[event](...args);
		return Promise.all(Object.values(this.services)
			.filter(service => typeof service[onText(event)] === "function" && service.enabled)
			.map(service => {
				if (service.guildOnly && !context.guild) return;
				if (service.fetchPartials)
					return context.fetchPartials().then(ctx => service[onText(event)](ctx));
				return Promise.resolve(service[onText(event)](context));
			}));
	}

	async runTimedEvent(event, args) {
		const context = this.client.contextGenerator.timedEvent(...args);
		return Promise.all(Object.values(this.services)
			.filter(service => typeof service[everyText(event)] === "function" && service.enabled)
			.map(service => Promise.resolve(service[everyText(event)](context))));
	}

	registerUsedEvents() {
		Object.values(this.services).reduce((events, service) => events.concat(userFunctions(service)), [])
			.filter(eventName => eventName.startsWith("on") || eventName.startsWith("every"))
			.forEach(event => this.usedEvents.add(event));
		return this;
	}

	registerClientEvents() {
		this.usedClientEvents = new Set([...this.clientEvents].filter(event => this.usedEvents.has(onText(event))));
		for (const event of this.usedClientEvents)
			this.client.on(event, (...args) => this.runClientEvent(event, args));
		return this;
	}

	registerTimedEvents() {
		this.usedTimedEvents = new Set([...this.timedEvents].filter(interval => this.usedEvents.has(everyText(interval))));
		for (const event of this.usedTimedEvents)
			setInterval(() => this.runTimedEvent(event, []), this.intervals[event] * 1000);
		return this;
	}
}

module.exports = new ServiceHandler();