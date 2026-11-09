import test from "node:test";
import assert from "node:assert/strict";
import { retrieveGroundedAnswer } from "../src/retrieval.js";

const general = `User: מה השפה של התשובה?
Assistant[he]: יש לענות באותה שפה שבה המשתמש כתב את ההודעה האחרונה.
`;
const code = `User: מה זה משתנה?
Assistant[he]: משתנה הוא מקום בעל שם שבו תוכנית שומרת ערך.
`;

test("retrieves a relevant Hebrew answer from the selected model corpus", () => {
  assert.equal(retrieveGroundedAnswer({ question: "מה זה משתנה?", corpus: code, language: "he", modelId: "retzef-code" }), "משתנה הוא מקום בעל שם שבו תוכנית שומרת ערך.");
});

test("uses the API-key owner's taught examples", () => {
  assert.equal(retrieveGroundedAnswer({ question: "מה זה רצף?", corpus: general, language: "he", trainingExamples: [{ input: "מה זה רצף?", expectedOutput: "רצף הוא סדר של דברים." }] }), "רצף הוא סדר של דברים.");
});

test("does not invent an answer when there is no relevant training example", () => {
  assert.equal(retrieveGroundedAnswer({ question: "מי זכה באליפות השנה?", corpus: general, language: "he" }), null);
});

test("creative model has its own distinct Hebrew creative answer", () => {
  const creative = `User: תן לי רעיון לפרויקט יצירתי.\nAssistant[he]: בנה עולם אינטראקטיבי קטן שבו כל בחירה משנה את הסצנה הבאה.`;
  assert.equal(retrieveGroundedAnswer({ question: "תן לי רעיון לפרויקט יצירתי", corpus: creative, language: "he", modelId: "retzef-creative" }), "בנה עולם אינטראקטיבי קטן שבו כל בחירה משנה את הסצנה הבאה.");
});
