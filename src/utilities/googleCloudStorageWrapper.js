const { Storage } = require("@google-cloud/storage");
const { MessageAttachment, Collection } = require("discord.js");
const got = require("got");
const path = require("path");
const { existsSync, mkdirSync } = require("fs");

module.exports = class StorageWrapper {
	constructor({ bucketName, absolutePathToKeyfile }) {
		this.projectId = require(absolutePathToKeyfile).project_id;
		this.storage = new Storage({ keyFilename: absolutePathToKeyfile, projectId: this.projectId });
		this.bucket = this.storage.bucket(bucketName);
	}

	getOrCreateDir(destination) {
		if (!existsSync(destination))
			mkdirSync(destination);
		return destination;
	}

	async uploadFile(path) {
		const [file] = await this.bucket.upload(path);
		const [url] = await file.getSignedUrl(this.defaultSignedUrlConfig);
		return { name: file.name, url };
	}

	async uploadAttachment(attachment) {
		if (!(attachment instanceof MessageAttachment)) return;
		const uploadName = [attachment.message.author.id, attachment.message.id, attachment.name || "unknown"].join("_");
		const file = this.bucket.file(uploadName);
		return new Promise((resolve, reject) =>
			got.stream(attachment.url)
				.pipe(file.createWriteStream())
				.on("error", err => reject(err))
				.on("finish", resolve({
					...attachment,
					url: `https://${this.bucket.name}/${uploadName}`
				}))
		);
	}

	async uploadAttachments(...attachments) {
		if (attachments.length > 1 && attachments.every(a => a instanceof MessageAttachment))
			return Promise.all(attachments.map(a => this.uploadAttachment(a)));
		else if (attachments[0] instanceof Array || attachments[0] instanceof Collection)
			return Promise.all(attachments[0].map(a => this.uploadAttachment(a)));
	}

	async uploadAttachmentsFromMessage(message) {
		return this.uploadAttachments(message.attachments.map(a => { a.message = message; return a; }));
	}

	async downloadFile(filename, destination) {
		const [{ name }] = await this.getFilesByName(filename);
		const [file] = await this.bucket.file(name).get();
		destination = this.getOrCreateDir(path.resolve(String(destination) || "../localdata/"));
		await file.download({ destination });
		return { name: file.name, location: path.join(destination, file.name) };
	}

	async downloadFiles(filename, destination) {
		const files = await this.getFilesByName(filename);
		destination = this.getOrCreateDir(path.resolve(String(destination) || "../localdata/"));
		return Promise.all(files.map(async ({ name }) => {
			const [file] = this.bucket.file(name).get();
			await file.download(destination);
			return { name: file.name, location: path.join(destination, file.name) };
		}));
	}

	async downloadUserAttachments(userId, destination) {
		const files = await this.getUserAttachments(userId);
		destination = this.getOrCreateDir(path.resolve(String(destination) || "../localdata/"));
		return Promise.all(files.map(async ({ name }) => {
			const [file] = this.bucket.file(name).get();
			await file.download(destination);
			return { name: file.name, location: path.join(destination, file.name) };
		}));
	}

	async downloadMessageAttachments(messageId, destination) {
		const files = await this.getMessageAttachments(messageId);
		destination = this.getOrCreateDir(path.resolve(String(destination) || "../localdata/"));
		return Promise.all(files.map(async ({ name }) => {
			const [file] = this.bucket.file(name).get();
			await file.download(destination);
			return { name: file.name, location: path.join(destination, file.name) };
		}));
	}

	async listFiles(prefix) {
		const [files] = await this.bucket.getFiles({ prefix });
		return Promise.all(files.map(async file => {
			const url = await file.getSignedUrl(this.defaultSignedUrlConfig);
			if (file.name.match(/[0-9]{15,25}_[0-9]{15,25}_.*/gi)) {
				const [userId, messageId, ...rest] = file.name.split("_");
				return { userId, messageId, name: rest.join("_"), url };
			}
			return { name: file.name, url };
		}));
	}

	async getFilesByName(filename) {
		const files = await this.listFiles();
		return files.filter(({ name }) => name.toLowerCase().includes(filename.toLowerCase()));
	}

	async getUserAttachments(userId) {
		const files = await this.listFiles();
		return files.filter(file => file.userId && file.userId === userId);
	}

	async getMessageAttachments(messageId) {
		const files = await this.listFiles();
		return files.filter(file => file.messageId && file.messageId === messageId);
	}

	async deleteFile(name, ignoreIds = true) {
		if (!name) return;
		const [files] = await this.bucket.getFiles();
		const file = files.find(f => {
			let filename = f.name;
			if (ignoreIds) {
				const [userId, messageId, ...rest] = f.name.split("_");
				filename = rest.join("_");
			}
			return filename.toLowerCase().includes(name.toLowercase());
		});
		return file.delete();
	}

	async deleteFiles(name, ignoreIds = true) {
		const [files] = await this.bucket.getFiles();
		if (!name)
			return Promise.all(files.map(f => f.delete()));
		else if (name) {
			const file = files.filter(f => {
				let filename = f.name;
				if (ignoreIds) {
					const [userId, messageId, ...rest] = f.name.split("_");
					filename = rest.join("_");
				}
				return filename.toLowerCase().includes(name.toLowercase());
			});
			return file.delete();
		}
	}
};