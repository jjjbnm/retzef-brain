import { trainAllModels } from "../src/model-registry.js";

try {
  const results = await trainAllModels();
  for (const result of results) {
    console.log(
      result.name + ": trained on " + result.tokens +
      " tokens; vocabulary " + result.vocabulary +
      "; contexts " + result.contexts
    );
    console.log("Saved: " + result.outputPath);
  }
} catch (error) {
  console.error("Model training failed:", error.message);
  process.exitCode = 1;
}
