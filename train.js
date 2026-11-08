import { readFile, mkdir, writeFile } from "node:fs/promises";
import { TinyLanguageModel } from "./brain/tiny-model.js";

const data = JSON.parse(await readFile(new URL("./data/hebrew-sample.json", import.meta.url), "utf8"));
const model = new TinyLanguageModel().train(data);
await mkdir(new URL("./models/", import.meta.url), { recursive: true });
await writeFile(new URL("./models/retzef-brain.json", import.meta.url), JSON.stringify(model.toJSON(), null, 2));
console.log(`Retzef Brain trained: ${data.length} text samples, ${model.vocabulary.size} unique tokens.`);
console.log("Saved to models/retzef-brain.json");
