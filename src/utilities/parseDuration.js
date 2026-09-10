const units = Object.freeze({
	ms: 1,
	s: 1000,
	sec: 1000,
	second: 1000,
	seconds: 1000,
	m: 60 * 1000,
	min: 60 * 1000,
	minute: 60 * 1000,
	minutes: 60 * 1000,
	h: 60 * 60 * 1000,
	hr: 60 * 60 * 1000,
	hour: 60 * 60 * 1000,
	hours: 60 * 60 * 1000,
	d: 24 * 60 * 60 * 1000,
	day: 24 * 60 * 60 * 1000,
	days: 24 * 60 * 60 * 1000,
	w: 7 * 24 * 60 * 60 * 1000,
	week: 7 * 24 * 60 * 60 * 1000,
	weeks: 7 * 24 * 60 * 60 * 1000
});

function parseDuration(value) {
	if (typeof value !== "string" || !value.trim()) return;

	const input = value.trim().toLowerCase();
	const token = /([0-9]+(?:\.[0-9]+)?)\s*([a-z]+)/gy;
	let total = 0;
	let matchedUntil = 0;

	while (matchedUntil < input.length) {
		token.lastIndex = matchedUntil;
		const match = token.exec(input);
		if (!match || typeof units[match[2]] !== "number") return;
		total += Number(match[1]) * units[match[2]];
		matchedUntil = token.lastIndex;
		while (/\s/.test(input[matchedUntil])) matchedUntil++;
	}

	return Number.isSafeInteger(total) ? total : undefined;
}

module.exports = parseDuration;
