const test = require("node:test");
const assert = require("node:assert/strict");
const {
	createGatewayIntents,
	gatewayIntentNames,
	privilegedIntentNames
} = require("../src/config/gatewayIntents.js");

test("requests only the gateway intents Emerald uses", () => {
	const FLAGS = Object.fromEntries(gatewayIntentNames.map((name, index) => [name, 2 ** index]));
	assert.deepEqual(createGatewayIntents({ FLAGS }), Object.values(FLAGS));
	assert.ok(!gatewayIntentNames.includes("GUILD_PRESENCES"));
	assert.ok(!gatewayIntentNames.includes("GUILD_MESSAGE_TYPING"));
});

test("documents exactly the privileged intents that need review", () => {
	assert.deepEqual(privilegedIntentNames, ["GUILD_MEMBERS", "MESSAGE_CONTENT"]);
});

test("rejects an unsupported Discord.js intent map", () => {
	assert.throws(() => createGatewayIntents({ FLAGS: {} }), /Unsupported gateway intent/);
	assert.throws(() => createGatewayIntents(), /Intents\.FLAGS is required/);
});
