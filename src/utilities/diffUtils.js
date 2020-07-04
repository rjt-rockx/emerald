const { Collection, GuildMember, Message, BitField } = require("discord.js");

const isObject = d => typeof d === "object" && d !== null;
const isBitField = element => element !== null && element instanceof BitField && typeof element.bitfield === "number";
const arraysEqual = (a, b) => {
	if (a === b) return true;
	if (a == null || b == null) return false;
	if (a.length !== b.length) return false;
	for (let index = 0; index < a.length; ++index)
		if (a[index] !== b[index]) return false;
	return true;
};

const flatten = (obj, ...props) => {
	if (!isObject(obj)) return obj;

	const objProps = Object.keys(obj)
		.filter(k => !k.startsWith("_"))
		.map(k => ({ [k]: true }));
	props = objProps.length ? Object.assign(...objProps, ...props) : Object.assign({}, ...props);

	const out = {};

	// eslint-disable-next-line prefer-const
	for (let [prop, newProp] of Object.entries(props)) {
		if (!newProp) continue;
		newProp = newProp === true ? prop : newProp;

		const element = obj[prop];
		const elemIsObj = isObject(element);
		const valueOf = elemIsObj && typeof element.valueOf === "function" ? element.valueOf() : null;
		const cache = elemIsObj && isObject(element.cache) ? element.cache : null;

		if (element instanceof Collection) out[newProp] = Array.from(element.keys());
		else if (cache instanceof Collection) out[newProp] = Array.from(cache.keys());
		else if (valueOf instanceof Collection) out[newProp] = Array.from(valueOf.keys());
		else if (Array.isArray(element)) out[newProp] = element.map(e => flatten(e));
		else if (typeof valueOf !== "object") out[newProp] = valueOf;
		else if (!elemIsObj) out[newProp] = element;
	}
	return out;
};

const getChanges = (oldInstance, newInstance, changes = {}) => {
	const flattened = {
		old: flatten(oldInstance),
		new: flatten(newInstance)
	};
	const keys = Object.keys({ ...flattened.old, ...flattened.new });
	for (const key of keys) {
		if (flattened.old[key] === flattened.new[key])
			continue;
		else if (flattened.old[key] !== flattened.new[key]
			|| typeof flattened.old[key] !== typeof flattened.new[key]) {
			if (Array.isArray(flattened.old[key]) && Array.isArray(flattened.new[key]) && arraysEqual(flattened.old[key], flattened.new[key]))
				continue;
			if (isBitField(oldInstance[key]) && isBitField(newInstance[key]) && (oldInstance[key].bitfield === newInstance[key].bitfield))
				continue;
			changes[key] = {
				old: oldInstance[key],
				new: newInstance[key]
			};
			if (key.endsWith("ID")) {
				const extraKey = key.substring(0, key.lastIndexOf("ID"));
				changes[extraKey] = {
					old: oldInstance[extraKey],
					new: newInstance[extraKey]
				};
			}
		}
	}
	return changes;
};

const diff = (oldInstance, newInstance) => {
	const changes = {};
	if ([oldInstance, newInstance].every(i => i instanceof GuildMember)) {
		const voiceChanges = {}, presenceChanges = {};
		getChanges(oldInstance.voice, newInstance.voice, voiceChanges);
		if (Object.keys(voiceChanges).length)
			changes.voice = {
				old: oldInstance.voice,
				new: newInstance.voice
			};
		getChanges(oldInstance.presence, newInstance.presence, presenceChanges);
		if (Object.keys(presenceChanges).length)
			changes.presence = {
				old: oldInstance.presence,
				new: newInstance.presence
			};
	}
	else if ([oldInstance, newInstance].every(i => i instanceof Message)) {
		const editChanges = {}, mentionChanges = {};
		getChanges(oldInstance.edits, newInstance.edits, editChanges);
		if (Object.keys(editChanges).length)
			changes.edits = {
				old: oldInstance.edits,
				new: newInstance.edits
			};
		getChanges(oldInstance.mentions, newInstance.mentions, mentionChanges);
		if (Object.keys(mentionChanges).length)
			changes.mentions = {
				old: oldInstance.mentions,
				new: newInstance.mentions
			};
		if ((Array.isArray(oldInstance.embeds) && !newInstance.embeds)
			|| (Array.isArray(newInstance.embeds) && !oldInstance.embeds)
			|| newInstance.embeds.map(x => JSON.stringify(flatten(x))).some(e => oldInstance.embeds.map(x => JSON.stringify(flatten(x))).includes(e))) {
			changes.embeds = {
				old: oldInstance.embeds,
				new: newInstance.embeds
			};
		}
	}
	else getChanges(oldInstance, newInstance, changes);
	return changes;
};

module.exports = diff;
module.exports.flatten = flatten;