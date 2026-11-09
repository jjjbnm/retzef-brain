const STOP_WORDS = new Set([
  "the", "a", "an", "and", "or", "is", "are", "am", "to", "of", "in", "on", "for", "with", "what", "how", "can", "you", "i", "me", "my", "it", "this", "that", "do", "does", "please",
  "מה", "זה", "זאת", "איך", "אני", "אתה", "את", "של", "על", "עם", "לי", "את", "האם", "אפשר", "תן", "תני", "בבקשה", "הוא", "היא", "שלי", "שלך", "למה", "כמה", "מי"
]);

function terms(value) {
  return [...new Set(String(value || "").normalize("NFKC").toLocaleLowerCase().match(/[\p{L}\p{N}]{2,}/gu) || [])]
    .filter((word) => !STOP_WORDS.has(word));
}

function scoreQuestion(question, candidate) {
  const wanted = terms(question);
  const available = terms(candidate);
  if (!wanted.length || !available.length) return 0;
  let overlap = 0;
  for (const word of wanted) {
    if (available.some((other) => other === word || (word.length >= 5 && other.length >= 5 && (word.startsWith(other.slice(0, 4)) || other.startsWith(word.slice(0, 4)))))) overlap += 1;
  }
  const recall = overlap / wanted.length;
  const precision = overlap / available.length;
  return 0.72 * recall + 0.28 * precision;
}

function corpusPairs(corpus) {
  const blocks = String(corpus || "").split(/(?=^User:\s*)/m);
  const pairs = [];
  for (const block of blocks) {
    const match = block.match(/^User:\s*(.+?)\s*\r?\nAssistant\[([^\]]+)\]:\s*([\s\S]*?)\s*$/);
    if (match) pairs.push({ input: match[1].trim(), output: match[3].trim(), language: match[2].trim().toLowerCase() });
  }
  return pairs;
}

export function retrieveGroundedAnswer({ question, corpus, trainingExamples = [], modelId = "retzef-general", language = "en" }) {
  const preferred = String(language || "en").toLowerCase();
  const taught = Array.isArray(trainingExamples) ? trainingExamples.map((item) => ({
    input: String(item.input || ""),
    output: String(item.expectedOutput || item.expected_output || ""),
    language: /[\u0590-\u05FF]/.test(String(item.input || "")) ? "he" : "en"
  })).filter((item) => item.input && item.output) : [];
  const learned = [...taught, ...corpusPairs(corpus)].filter((item) => !item.language || item.language === preferred || (preferred !== "he" && item.language === "en"));
  let best = null;
  for (const item of learned) {
    const score = scoreQuestion(question, item.input);
    if (!best || score > best.score) best = { ...item, score };
  }
  if (best && best.score >= 0.43) return best.output;
  return null;
}

