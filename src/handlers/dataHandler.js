const QuickDB = require("quick.db");

class DataHandler {

	async initialize(client) {
		this.globalStorage = new QuickDB.table("global");
		this.guildStorages = [];
		this.client = client;
		this.client.dataHandler = this;
		this.setupGuilds();
		return this.guildStorages;
	}

	setupGuilds() {
		const guilds = this.client.guilds.cache;
		for (const [id, guild] of guilds) {
			const guildStorage = new QuickDB.table(`g_${id}`);
			this.guildStorages.push({ id, guildStorage });

			if (guildStorage.has("commandPrefix"))
				guild.commandPrefix = guildStorage.get("commandPrefix");
			else {
				guild.commandPrefix = this.client.commandPrefix;
				guildStorage.set("commandPrefix", guild.commandPrefix);
			}
		}
	}

	getGuildStorage(guildId) {
		return new QuickDB.table(`g_${guildId}`);
	}

	getGlobalStorage() {
		return new QuickDB.table("global");
	}
}

module.exports = new DataHandler();