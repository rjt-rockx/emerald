const gatewayIntentNames = Object.freeze([
	"GUILDS",
	"GUILD_MEMBERS",
	"GUILD_VOICE_STATES",
	"GUILD_MESSAGES",
	"GUILD_MESSAGE_REACTIONS",
	"DIRECT_MESSAGES",
	"DIRECT_MESSAGE_REACTIONS"
]);

const privilegedIntentNames = Object.freeze([
	"GUILD_MEMBERS",
	"MESSAGE_CONTENT"
]);

function createGatewayIntents(Intents) {
	if (!Intents || !Intents.FLAGS)
		throw new TypeError("Discord.js Intents.FLAGS is required.");

	return gatewayIntentNames.map(name => {
		if (typeof Intents.FLAGS[name] !== "number")
			throw new Error(`Unsupported gateway intent: ${name}`);
		return Intents.FLAGS[name];
	});
}

module.exports = { createGatewayIntents, gatewayIntentNames, privilegedIntentNames };
