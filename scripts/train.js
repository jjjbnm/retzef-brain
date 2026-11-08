import { readFile, writeFile, mkdir } from "node:fs/promises";
import { RetzefNgramModel } from "../src/model.js";

const corpusPath = process.argv[2] ?? "data/training.txt";
const outputPath = process.argv[3] ?? "model/retzef-model.json";
const corpus = await readFile(corpusPath, "utf8");
const model = new RetzefNgramModel({ order: 3, temperature: 0.8, maxTokens: 48 });
const stats = model.train(corpus);
await mkdir("model", { recursive: true });
await writeFile(outputPath, JSON.stringify(model.toJSON(), null, 2) + "\n");
console.log("Retzef Brain training complete");
console.log(JSON.stringify({ ...stats, outputPath }, null, 2));
