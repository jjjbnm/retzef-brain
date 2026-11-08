import { readFile } from "node:fs/promises";
import { createInterface } from "node:readline/promises";
import { stdin, stdout } from "node:process";
import { RetzefNgramModel } from "../src/model.js";

const modelFile = process.argv[2] ?? "model/retzef-model.json";
const model = RetzefNgramModel.fromJSON(JSON.parse(await readFile(modelFile, "utf8")));
const rl = createInterface({ input: stdin, output: stdout });
console.log("Retzef Brain demo (tiny n-gram model). Type /exit to stop.");
while (true) {
  const prompt = await rl.question("אתה: ");
  if (prompt.trim() === "/exit") break;
  try {
    console.log("Retzef:", model.generate(prompt));
  } catch (error) {
    console.log("שגיאה:", error.message);
  }
}
rl.close();
