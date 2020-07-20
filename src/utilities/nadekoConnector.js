const got = require("got");
const jwt = require("jsonwebtoken");
const jsonbs = require("json-bigint")({ storeAsString: true });

class NadekoConnectorClient {

	/**
	 * Creates a new NadekoConnector client for the specified address and password.
	 * @param {String} address Address of the connector. Specify either the domain (eg: "zynxxer.ml") or IP Address and port together (eg: "12.34.56.78:1234").
	 * @param {String} password Password for the connector.
	 */
	constructor(address, password) {
		this.address = address;
		this.password = password;
	}

	/**
	 * Requests and gets data from a specific endpoint.
	 * @param {String} endpoint Name of the endpoint.
	 * @param {String} data Data to send to the endpoint.
	 * @returns {Object} Parsed info returned by the endpoint.
	 */
	async getData(endpoint, data) {
		const token = jwt.sign(data, this.password);
		return got(`${this.address}/${endpoint}/${token}`).then(response => jsonbs.parse(response.body));
	}

	/**
	 * Gets info about the bot.
	 * @returns {Object} Info about the bot.
	 */
	async getBotInfo() {
		return this.getData("getBotInfo", {});
	}

	/**
	 * Gets the tables present in the database.
	 * @returns {Object} Array of table names.
	 */
	async getTables() {
		return this.getData("getTables", {});
	}

	/**
	 * Gets fields present in the specified table.
	 * @param {String} table Name of the table.
	 * @returns {Object} Array of field names.
	 */
	async getFields(table) {
		return this.getData("getFields", { table });
	}

	/**
	 * Execute a raw SQL query and return the rows.
	 * @param {String} command The SQL command to execute.
	 * @returns {Object} Result of the command, array of rows if multiple rows were affected or a single JSON object if a single row was affected.
	 */
	async execSql(command) {
		return this.getData("execSql", { command });
	}

	/**
	 * Get the currency of a Discord user.
	 * @param {String} userId ID of the Discord user.
	 * @returns {Object} Balance info about the specified user.
	 */
	async getCurrency(userId) {
		return this.getData("getCurrency", { userId });
	}

	/**
	 * Set the currency of a Discord user. NOT RECOMMENDED! Use addCurrency instead for normal transactions.
	 * @param {String} userId ID of the Discord user.
	 * @param {Number} currency Currency amount to be set.
	 * @returns {Object} Balance info about the specified user.
	 */
	async setCurrency(userId, currency) {
		return this.getData("setCurrency", { userId, currency });
	}

	/**
	 * Add currency to a user.
	 * @param {String} userId ID of the Discord user.
	 * @param {Number} currency Currency amount to be added.
	 * @param {String} reason Reason for the transaction.
	 * @returns {Object} Balance info about the specified user.
	 */
	async addCurrency(userId, currency, reason) {
		return this.getData("addCurrency", { userId, currency, reason });
	}

	/**
	 * Subtract currency from a user.
	 * @param {String} userId ID of the Discord user.
	 * @param {Number} currency Currency amount to be subtracted.
	 * @param {String} reason Reason for the transaction.
	 * @returns {Object} Balance info about the specified user.
	 */
	async subtractCurrency(userId, currency, reason) {
		return this.getData("subtractCurrency", { userId, currency, reason });
	}

	/**
	 * Create a transaction for a Discord user.
	 * @param {String} userId ID of the Discord user.
	 * @param {Number} currency Amount added to or subtracted from the user.
	 * @param {String} reason Reason for the transaction.
	 * @returns {Object} Transaction info.
	 */
	async createTransaction(userId, currency, reason) {
		return this.getData("createTransaction", { userId, currency, reason });
	}

	/**
	 * Get transactions of a Discord user.
	 * @param {String} userId ID of the Discord user.
	 * @param {Number} startPosition Start position/offset of transactions.
	 * @param {Number} items Items per page.
	 * @returns {Object} Transactions.
	 */
	async getTransactions(userId, startPosition, items) {
		return this.getData("getTransactions", { userId, startPosition, items });
	}

	/**
	 * Get ranking of a Discord user in a specific guild.
	 * @param {String} userId ID of the Discord user.
	 * @param {String} guildId ID of the Discord guild.
	 * @returns {Object} Rank info.
	 */
	async getGuildRank(userId, guildId) {
		return this.getData("getGuildRank", { userId, guildId });
	}

	/**
	 * Get the guild XP of a Discord user.
	 * @param {String} userId ID of the Discord user.
	 * @param {String} guildId ID of the Discord guild.
	 * @returns {Object} Information about the user's XP.
	 */
	async getGuildXp(userId, guildId) {
		return this.getData("getGuildXp", { userId, guildId });
	}

	/**
	 * Set the guild XP of a Discord user.
	 * @param {String} userId ID of the Discord user.
	 * @param {String} guildId ID of the Discord guild.
	 * @param {String} xp XP of the Discord user.
	 * @param {String} awardedXp XP awarded to the Discord user.
	 * @returns {Object} Information about the user's guild XP.
	 */
	async setGuildXp(userId, guildId, xp, awardedXp) {
		return this.getData("setGuildXp", { userId, guildId, xp, awardedXp });
	}

	/**
	 * Add guild XP to a Discord user.
	 * @param {String} userId ID of the Discord user.
	 * @param {String} guildId ID of the Discord guild.
	 * @param {String} xp XP to be added.
	 * @returns {Object} Information about the user's guild XP.
	 */
	async addGuildXp(userId, guildId, xp) {
		return this.getData("addGuildXp", { userId, guildId, xp });
	}

	/**
	 * Subtract guild XP from a Discord user.
	 * @param {String} userId ID of the Discord user.
	 * @param {String} guildId ID of the Discord guild.
	 * @param {String} xp XP to be subtracted.
	 * @returns {Object} Information about the user's guild XP.
	 */
	async subtractGuildXp(userId, guildId, xp) {
		return this.getData("subtractGuildXp", { userId, guildId, xp });
	}

	/**
	 * Award guild XP to a Discord user.
	 * @param {String} userId ID of the Discord user.
	 * @param {String} guildId ID of the Discord guild.
	 * @param {String} xp XP to be awarded.
	 * @returns {Object} Information about the user's guild XP.
	 */
	async awardGuildXp(userId, guildId, xp) {
		return this.getData("awardGuildXp", { userId, guildId, xp });
	}

	/**
	 * Get XP leaderboard of a Discord guild.
	 * @param {String} guildId ID of the guild to get XP leaderboard of.
	 * @param {Number} startPosition Start position/offset of the page.
	 * @param {Number} items Items per page.
	 * @returns {Object} Leaderboard page.
	 */
	async getGuildXpLeaderboard(guildId, startPosition, items) {
		return this.getData("getGuildXpLeaderboard", { guildId, startPosition, items });
	}

	/**
	 * Get XP role rewards of a Discord guild.
	 * @param {String} guildId ID of the guild to get XP role rewards of.
	 * @param {Number} startPosition Start position/offset of the page.
	 * @param {Number} items Items per page.
	 * @returns {Object} Role rewards page.
	 */
	async getGuildXpRoleRewards(guildId, startPosition, items) {
		return this.getData("getGuildXpRoleRewards", { guildId, startPosition, items });
	}

	/**
	 * Get XP currency rewards of a Discord guild.
	 * @param {String} guildId ID of the guild to get XP currency rewards of.
	 * @param {Number} startPosition Start position/offset of the page.
	 * @param {Number} items Items per page.
	 * @returns {Object} Currency rewards page.
	 */
	async getGuildXpCurrencyRewards(guildId, startPosition, items) {
		return this.getData("getGuildXpCurrencyRewards", { guildId, startPosition, items });
	}

	/**
	 * Get global ranking of a Discord user.
	 * @param {String} userId ID of the user to get global ranking of.
	 * @returns {Object} Rank info.
	 */
	async getGlobalRank(userId) {
		return this.getData("getGlobalRank", { userId });
	}

	/**
 	* Get the global XP of a Discord user.
 	* @param {String} userId ID of the Discord user.
 	* @returns {Object} Information about the user's global XP.
 	*/
	async getGlobalXp(userId) {
		return this.getData("getGlobalXp", { userId });
	}

	/**
	 * Get the global XP leaderboard.
	 * @param {Number} startPosition Start position/offset of the page.
	 * @param {Number} items Items per page.
	 * @returns {Object} Leaderboard page.
	 */
	async getGlobalXpLeaderboard(startPosition, items) {
		return this.getData("getGlobalXpLeaderboard", { startPosition, items });
	}

	/**
	 * Get club leaderboard.
	 * @param {Number} startPosition Start position/offset of the page.
	 * @param {Number} items Items per page.
	 * @returns {Object} Leaderboard page.
	 */
	async getClubLeaderboard(startPosition, items) {
		return this.getData("getClubLeaderboard", { startPosition, items });
	}

	/**
	 * Get club information by name.
	 * @param {Number} name Name of the club.
	 * @returns {Object} Information about the club.
	 */
	async getClubInfo(name) {
		return this.getData("getClubInfo", { name });
	}

	/**
	 * Get club information by club member.
	 * @param {Number} userId ID of the club member.
	 * @returns {Object} Information about the club.
	 */
	async getClubInfoByUser(userId) {
		return this.getData("getClubInfoByUser", { userId });
	}

	/**
	 * Get club members by name.
	 * @param {Number} name Name of the club.
	 * @param {Number} startPosition Start position/offset of the page.
	 * @param {Number} items Items per page.
	 * @returns {Object} Members page.
	 */
	async getClubMembers(name, startPosition, items) {
		return this.getData("getClubMembers", { name, startPosition, items });
	}
}

module.exports = NadekoConnectorClient;