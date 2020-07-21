const { Collection, GuildMember, Message, Emoji, BitField } = require("discord.js");

const isObject = d => typeof d === "object" && d !== null;
const isBitField = element => element !== null && element instanceof BitField && typeof element.bitfield === "number";
const areEqualArrays = (a, b) => a.length === b.length && a.every(item => b.includes(item)) && b.every(item => a.includes(item));

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

const getChanges = (oldInstance, newInstance, key, changes = {}) => {
	if (Array.isArray(oldInstance[key]) && Array.isArray(newInstance[key]) && !areEqualArrays(oldInstance[key], newInstance[key])) {
		changes[key] = {
			old: oldInstance[key],
			new: newInstance[key]
		};
	}
	else if (oldInstance[key] !== newInstance[key]) {
		if (isBitField(oldInstance[key]) && isBitField(newInstance[key]) && (oldInstance[key].bitfield === newInstance[key].bitfield))
			return;
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
};

const diff = (oldInstance, newInstance) => {
	const changes = {};
	if ([oldInstance, newInstance].every(i => i instanceof GuildMember)) {
		Object.keys(flatten(newInstance, { roles: true })).forEach(key => getChanges(oldInstance, newInstance, key, changes));
		const voiceChanges = {}, presenceChanges = {};
		Object.keys(flatten(newInstance.voice)).forEach(key => getChanges(oldInstance.voice, newInstance.voice, key, voiceChanges));
		if (Object.keys(voiceChanges).length)
			changes.voice = {
				old: oldInstance.voice,
				new: newInstance.voice
			};
		Object.keys(flatten(newInstance.presence)).forEach(key => getChanges(oldInstance.presence, newInstance.presence, key, presenceChanges));
		if (Object.keys(presenceChanges).length)
			changes.presence = {
				old: oldInstance.presence,
				new: newInstance.presence
			};
	}
	else if ([oldInstance, newInstance].every(i => i instanceof Message)) {
		const editChanges = {}, mentionChanges = {};
		Object.keys(flatten(newInstance.edits)).forEach(key => getChanges(oldInstance.edits, newInstance.edits, key, editChanges));
		if (Object.keys(editChanges).length)
			changes.edits = {
				old: oldInstance.edits,
				new: newInstance.edits
			};
		Object.keys(flatten(newInstance.mentions)).forEach(key => getChanges(oldInstance.mentions, newInstance.mentions, key, mentionChanges));
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
	else if ([oldInstance, newInstance].every(i => i instanceof Emoji))
		Object.keys(flatten(newInstance, { roles: true })).forEach(key => getChanges(oldInstance, newInstance, key, changes));
	else Object.keys(flatten(newInstance)).forEach(key => getChanges(oldInstance, newInstance, key, changes));
	return changes;
};

module.exports = diff;
module.exports.flatten = flatten;
module.exports.getChanges = getChanges;