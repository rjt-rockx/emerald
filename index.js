const config = require("./config.js");
const { CommandoClient } = require("discord.js-commando");
const { Intents } = require("discord.js");
const structureHandler = require("./src/handlers/structureHandler.js");
const serviceHandler = require("./src/handlers/serviceHandler.js");
const commandHandler = require("./src/handlers/commandHandler.js");
const dataHandler = require("./src/handlers/dataHandler.js");
const contextGenerator = require("./src/contextGenerator.js");
const logger = require("./src/utilities/logger.js");

structureHandler.initialize();

const client = new CommandoClient({
	owner: config.owners,
	commandPrefix: config.defaultPrefix,
	nonCommandEditable: false,
	commandEditableDuration: 0,
	partials: ["CHANNEL", "MESSAGE", "REACTION"],
	intents: [
		Intents.FLAGS.GUILDS,
		Intents.FLAGS.GUILD_EMOJIS_AND_STICKERS,
		Intents.FLAGS.GUILD_MESSAGES,
		Intents.FLAGS.GUILD_MESSAGE_REACTIONS,
		Intents.FLAGS.GUILD_WEBHOOKS,
		Intents.FLAGS.GUILD_INVITES,
		Intents.FLAGS.GUILD_BANS,
		Intents.FLAGS.GUILD_MEMBERS,
		Intents.FLAGS.GUILD_PRESENCES
	]
});

client.once("ready", async () => {
	logger.info(`Logged in as ${client.user.tag} (${client.user.id})`);

	contextGenerator.initialize(client)
		.then(() => logger.info("Context generator initialized."))
		.catch(logger.error);

	serviceHandler.initialize(client)
		.then(services => logger.info(`${services.length} services initialized.`))
		.catch(logger.error);

	commandHandler.initialize(client)
		.then(commands => logger.info(`${commands.length} commands initialized.`))
		.catch(logger.error);

	dataHandler.initialize(client)
		.then(guildStorages => logger.info(`${guildStorages.length} guilds initialized.`))
		.catch(logger.error);
});

client.on("ready", () => client.user.setActivity(`Type ${client.commandPrefix}help for help!`));

client.on("error", err => logger.error(err));

client.login(config.token);