
const escapeRegex = text => text.replace(/[|\\{}()[\]^$+*?.]/g, "\\$&").replace(/-/g, "\\x2d");
const deepProps = x => x && x !== Object.prototype && Object.getOwnPropertyNames(x).concat(deepProps(Object.getPrototypeOf(x)) || []);
const deepFunctions = x => deepProps(x).filter(name => typeof x[name] === "function");
const userFunctions = x => [...new Set(deepFunctions(x).filter(name => name !== "constructor" && !~name.indexOf("_")))];
const toTitleCase = str => str.replace(/\w\S*/g, txt => txt.charAt(0).toUpperCase() + txt.substr(1));
const properRoundToTwo = num => +(Math.round(num + "e+2") + "e-2");
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

module.exports = { escapeRegex, deepProps, deepFunctions, userFunctions, toTitleCase, properRoundToTwo, DiscordColors };