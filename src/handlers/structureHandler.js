const { readdirSync } = require("fs");
const { resolve, join } = require("path");
const { Structures } = require("discord.js");

class StructureHandler {
	constructor() {
		this.structures = [];
		this.validStructures = [
			"GuildEmoji",
			"DMChannel",
			"TextChannel",
			"VoiceChannel",
			"CategoryChannel",
			"NewsChannel",
			"StoreChannel",
			"GuildMember",
			"Guild",
			"Message",
			"MessageReaction",
			"Presence",
			"ClientPresence",
			"VoiceState",
			"Role",
			"User"
		];
	}

	initialize() {
		return this.addStructuresIn("../structures/");
	}

	addStructure(structure) {
		if (typeof structure.type !== "string") return;
		if (!this.validStructures.includes(structure.type)) return;
		if (typeof structure.extender !== "function") return;
		Structures.extend(structure.type, structure.extender);
		this.structures.push(structure);
		return structure;
	}

	addStructuresIn(folder) {
		for (const filename of readdirSync(resolve(__dirname, folder))) {
			if (filename.endsWith(".js") && !filename.endsWith("index.js")) {
				const structure = require(join(folder, filename));
				this.addStructure(structure);
			}
		}
		return this.structures;
	}
}

module.exports = new StructureHandler();