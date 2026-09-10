const test = require("node:test");
const assert = require("node:assert/strict");
const parseDuration = require("../src/utilities/parseDuration.js");

test("parses single and compound human durations", () => {
	assert.equal(parseDuration("30s"), 30000);
	assert.equal(parseDuration("1 hour 30 minutes"), 5400000);
	assert.equal(parseDuration("2d 3h"), 183600000);
});

test("rejects empty, unknown, malformed and unsafe durations", () => {
	assert.equal(parseDuration(""), undefined);
	assert.equal(parseDuration("tomorrow"), undefined);
	assert.equal(parseDuration("1h nope"), undefined);
	assert.equal(parseDuration("999999999999999999999w"), undefined);
});
