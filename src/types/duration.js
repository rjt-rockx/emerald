const { ArgumentType } = require("discord.js-commando");
const parseDuration = require("../utilities/parseDuration.js");

class DurationArgumentType extends ArgumentType {
	constructor(client) {
		super(client, "duration");
	}

	validate(val) {
		const result = parseDuration(val);
		return Number.isSafeInteger(result) && result > 0 && result < Number.MAX_SAFE_INTEGER;
	}

	parse(val) {
		return parseDuration(val);
	}
}

module.exports = DurationArgumentType;
