import { readFile } from "node:fs/promises";
import readline from "node:readline";
import { TinyLanguageModel } from "./brain/tiny-model.js";

let model;
try {
  const saved = JSON.parse(await readFile(new URL("./models/retzef-brain.json", import.meta.url), "utf8"));
  model = TinyLanguageModel.fromJSON(saved);
} catch {
  console.log("Model file not found. Run: npm run train");
  process.exit(1);
}

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
console.log("Retzef Brain demo. Type /exit to quit.");
const ask = () => rl.question("You: ", (input) => {
  if (input.trim() === "/exit") return rl.close();
  console.log("Retzef:", model.generate(input, { maxTokens: 30 }));
  ask();
});
ask();
