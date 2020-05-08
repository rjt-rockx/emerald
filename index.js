const config = require("./config.js");
const { CommandoClient } = require("discord.js-commando");
const serviceHandler = require("./src/handlers/serviceHandler.js");
const commandHandler = require("./src/handlers/commandHandler.js");
const dataHandler = require("./src/handlers/dataHandler.js");
const contextGenerator = require("./src/contextGenerator.js");
const logger = require("./src/logger.js");

const client = new CommandoClient({
	owner: config.owners,
	commandPrefix: config.defaultPrefix,
	nonCommandEditable: false,
	commandEditableDuration: 0,
	partials: ["CHANNEL", "MESSAGE", "REACTION"]
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

	client.user.setActivity(`Type ${client.commandPrefix}help for help!`);
});

client.on("error", err => logger.error(err));

client.login(config.token);