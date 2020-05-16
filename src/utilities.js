
const escapeRegex = text => text.replace(/[|\\{}()[\]^$+*?.]/g, "\\$&").replace(/-/g, "\\x2d");
const deepProps = x => x && x !== Object.prototype && Object.getOwnPropertyNames(x).concat(deepProps(Object.getPrototypeOf(x)) || []);
const deepFunctions = x => deepProps(x).filter(name => typeof x[name] === "function");
const userFunctions = x => [...new Set(deepFunctions(x).filter(name => name !== "constructor" && !~name.indexOf("_")))];
const toTitleCase = str => str.replace(/\w\S*/g, txt => txt.charAt(0).toUpperCase() + txt.substr(1));
const properRoundToTwo = num => +(Math.round(num + "e+2") + "e-2");
const newlinePattern = new RegExp("!!NL!!", "g");

module.exports = { escapeRegex, deepProps, deepFunctions, userFunctions, toTitleCase, newlinePattern };