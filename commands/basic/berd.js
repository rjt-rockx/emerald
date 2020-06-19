const BaseCommand = require("../../src/base/baseCommand.js");
const JIMP = require("jimp");
const randomNumber = limit => Math.floor(Math.random() * limit);

module.exports = class Berd extends BaseCommand {
	constructor(client) {
		super(client, {
			name: "berd",
			group: "basic",
			description: "Generate a random berd.",
			clientPermissions: ["SEND_MESSAGES", "EMBED_LINKS", "ATTACH_FILES"],
			args: [
				{
					key: "action",
					prompt: "Add a berd, remove a berd, list all berds or set the base berd",
					type: "string",
					oneOf: ["add", "remove", "list", "random"],
					default: "random"
				},
				{
					key: "type",
					prompt: "Type of berd to add or remove",
					type: "string",
					oneOf: ["base", "head", "body", "accessory", ""],
					default: ""
				},
				{
					key: "link",
					prompt: "Link to the berd image",
					type: "string",
					default: ""
				}
			]
		});
	}

	async task(ctx) {
		const berds = ctx.guildStorage.get("berds") || { head: [], body: [], accessory: [], base: "" };
		if (!["random", "list"].includes(ctx.args.action) && !ctx.member.hasPermission(["MANAGE_GUILD"]))
			return ctx.embed("You need to have Manage Server permission to modify berds.");
		if (!["list", "add"].includes(ctx.args.action) && !berds.base)
			return ctx.embed("No base berd set.");
		if (ctx.args.action === "random" && berds.base) {
			const randomHead = Math.random() > 0.5 && berds.head.length > 0 ? berds.head[randomNumber(berds.head.length)] : "";
			const randomBody = Math.random() > 0.5 && berds.body.length > 0 ? berds.body[randomNumber(berds.body.length)] : "";
			const randomAccessory = Math.random() > 0.5 && berds.accessory.length > 0 ? berds.accessory[randomNumber(berds.accessory.length)] : "";

			const combinedBuffer = await this.combineImages(berds.base, randomHead, randomBody, randomAccessory);
			return ctx.send({
				embed: { title: "Berd", image: { url: "attachment://berd.png" } },
				files: [{
					attachment: combinedBuffer,
					name: "berd.png"
				}]
			});
		}
		if (ctx.args.action === "add") {
			if (!ctx.args.type)
				return ctx.embed("No type specified.");
			if (!ctx.args.link)
				return ctx.embed("No link specified.");
			if (ctx.args.type === "base") {
				berds.base = ctx.args.link;
				ctx.guildStorage.set("berds", berds);
				return ctx.embed("Base berd successfully added.");
			}
			if (ctx.args.type === "head") {
				berds.head = [...new Set(berds.head).add(ctx.args.link)];
				ctx.guildStorage.set("berds", berds);
				return ctx.embed("Berd head successfully added.");
			}
			if (ctx.args.type === "body") {
				berds.body = [...new Set(berds.body).add(ctx.args.link)];
				ctx.guildStorage.set("berds", berds);
				return ctx.embed("Berd body successfully added.");
			}
			if (ctx.args.type === "accessory") {
				berds.accessory = [...new Set(berds.accessory).add(ctx.args.link)];
				ctx.guildStorage.set("berds", berds);
				return ctx.embed("Berd accessory successfully added.");
			}
		}
		if (ctx.args.action === "remove") {
			if (!ctx.args.type)
				return ctx.embed("No type specified.");
			if (ctx.args.type === "base") {
				berds.base = "";
				ctx.guildStorage.set("berds", berds);
				return ctx.embed("Base berd successfully removed.");
			}
			if (!ctx.args.link)
				return ctx.embed("No link specified.");
			if (ctx.args.type === "head") {
				berds.head = [...new Set(berds.head).delete(ctx.args.link)];
				ctx.guildStorage.set("berds", berds);
				return ctx.embed("Berd head successfully removed.");
			}
			if (ctx.args.type === "body") {
				berds.body = [...new Set(berds.body).delete(ctx.args.link)];
				ctx.guildStorage.set("berds", berds);
				return ctx.embed("Berd body successfully removed.");
			}
			if (ctx.args.type === "accessory") {
				berds.accessory = [...new Set(berds.accessory).delete(ctx.args.link)];
				ctx.guildStorage.set("berds", berds);
				return ctx.embed("Berd accessory successfully removed.");
			}
		}
		if (ctx.args.action === "list") {
			const fields = [
				{
					name: "Heads",
					value: berds.head.length < 1 ? "No berd heads set." : berds.head.map((link, index) => `[Head ${index + 1}](${link} "Berd Head")`).join("\n")
				},
				{
					name: "Bodies",
					value: berds.body.length < 1 ? "No berd bodies set." : berds.body.map((link, index) => `[Body ${index + 1}](${link} "Berd Body")`).join("\n")
				},
				{
					name: "Accessories",
					value: berds.accessory.length < 1 ? "No berd accessories set." : berds.accessory.map((link, index) => `[Accessory ${index + 1}](${link} "Berd Accessory")`).join("\n")
				}
			];
			return ctx.paginate(fields, {
				splitLongFields: true,
				embedTemplate: {
					title: "Berd list",
					description: berds.base ? `[Base](${berds.base} "Base Berd")` : "No base berd set."
				},
				chunkSize: 1
			});
		}
	}

	async combineImages(base, ...imagePaths) {
		let baseImage = await JIMP.read(base);
		for (const imagePath of imagePaths) {
			if (imagePath) {
				const image = await JIMP.read(imagePath);
				baseImage = baseImage.composite(image, 0, 0, JIMP.BLEND_SOURCE_OVER);
			}
		}
		return baseImage.getBufferAsync(JIMP.MIME_PNG);
	}
};