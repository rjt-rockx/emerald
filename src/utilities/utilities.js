
const { lstatSync, readdirSync } = require("fs");
const { join, parse } = require("path");

const escapeRegex = text => text.replace(/[|\\{}()[\]^$+*?.]/g, "\\$&").replace(/-/g, "\\x2d");
const deepProps = x => x && x !== Object.prototype && Object.getOwnPropertyNames(x).concat(deepProps(Object.getPrototypeOf(x)) || []);
const deepFunctions = x => deepProps(x).filter(name => typeof x[name] === "function");
const userFunctions = x => [...new Set(deepFunctions(x).filter(name => name !== "constructor" && !~name.indexOf("_")))];
const onText = str => str.replace(/\w\S*/g, txt => "on" + txt.charAt(0).toUpperCase() + txt.substr(1));
const everyText = str => str.replace(/\w\S*/g, txt => "every" + txt.charAt(0).toUpperCase() + txt.substr(1));
const toTitleCase = str => str.replace(/\w\S*/g, txt => txt.charAt(0).toUpperCase() + txt.substr(1));
const properRoundToTwo = num => +(Math.round(num + "e+2") + "e-2");
const camelCase = data => data.replace(/(_\w)/g, text => text[1].toUpperCase());
const camelCaseKeys = data => {
	const newData = {};
	for (const property in data) {
		if (Object.hasOwnProperty.apply(data, property))
			newData[camelCase(property)] = data[property];
	}
	return newData;
};
const isDirectory = source => lstatSync(source).isDirectory() && !source.startsWith(".");
const getDirectories = source => readdirSync(source).map(name => join(source, name)).filter(isDirectory).map(directory => parse(directory).name);
const idSort = (a, b) => a.id.localeCompare(b.id, undefined, { numeric: true });
const byText = text => text.toLowerCase() !== "all" ? text.toLowerCase() + "dBy" : "executor";
const chunk = (arrayLike, size) => arrayLike.length === 0 ? [] : [arrayLike.slice(0, size)].concat(chunk(arrayLike.slice(size), size));
const sleep = ms => new Promise(res => setTimeout(res, ms));
const grammarCombine = arrayLike => [arrayLike.slice(0, -1).join(", "), arrayLike.pop()].filter(w => w !== "").join(" and ");
const DiscordColors = {
	RED: 0xF04747,
	GREEN: 0x43B581,
	YELLOW: 0xFAA61A,
	BLUE: 0x00B0F4,
	PURPLE: 0x593695,
	BLURPLE: 0x7289DA,
	GREY: 0x747F8D,
	DARK_GREY: 0x2C2F33,
	DARKER_GREY: 0x23272A
};

module.exports = {
	escapeRegex,
	deepProps,
	deepFunctions,
	userFunctions,
	toTitleCase,
	properRoundToTwo,
	camelCase,
	camelCaseKeys,
	onText,
	everyText,
	byText,
	isDirectory,
	getDirectories,
	idSort,
	chunk,
	sleep,
	grammarCombine,
	DiscordColors
};