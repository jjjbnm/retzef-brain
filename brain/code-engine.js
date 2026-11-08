const LANGUAGES = Object.freeze({
  javascript:["js","jsx","mjs","cjs"], typescript:["ts","tsx"], python:["py"],
  html:["html","htm"], css:["css"], java:["java"], cpp:["cpp","cc","cxx","h","hpp"], csharp:["cs"]
});
const RULES = [
  {id:"debugger",severity:"warning",pattern:/\bdebugger\s*;/g,message:"Remove debugger statements before release.",suggestion:"Delete the debugger statement."},
  {id:"console-log",severity:"info",pattern:/\bconsole\.log\s*\(/g,message:"Review temporary console output.",suggestion:"Remove it or use a project-approved logger."},
  {id:"todo",severity:"info",pattern:/\bTODO\b|\bFIXME\b/g,message:"An unfinished TODO/FIXME marker was found.",suggestion:"Complete the task or track it as an issue."},
  {id:"eval",severity:"warning",pattern:/\beval\s*\(/g,message:"Dynamic eval increases security and debugging risk.",suggestion:"Use explicit parsing or a constrained alternative."},
  {id:"python-exec",severity:"warning",languages:["python"],pattern:/\bexec\s*\(/g,message:"Dynamic execution can be unsafe with untrusted input.",suggestion:"Avoid exec on untrusted input."},
  {id:"empty-catch",severity:"warning",pattern:/catch\s*\([^)]*\)\s*\{\s*\}/g,message:"An empty catch block can hide failures.",suggestion:"Handle the error or record safe diagnostic context."},
  {id:"hard-coded-secret",severity:"critical",pattern:/(?:api[_-]?key|secret|password|token)\s*[:=]\s*["'][^"']{8,}["']/gi,message:"Possible hard-coded credential.",suggestion:"Remove the value, use a protected server-side environment variable, and rotate it if real."}
];
function detectLanguage(language,filename) {
  const explicit=String(language||"").toLowerCase();
  if(LANGUAGES[explicit]) return explicit;
  const ext=String(filename||"").split(".").pop().toLowerCase();
  return Object.entries(LANGUAGES).find(([,xs])=>xs.includes(ext))?.[0]||"unknown";
}
function matches(source,pattern) { return [...source.matchAll(new RegExp(pattern.source,pattern.flags.includes("g")?pattern.flags:pattern.flags+"g"))]; }
function lineColumn(source,index) { const before=source.slice(0,index),line=before.split("\n").length; return {line,column:index-(before.lastIndexOf("\n")+1)+1}; }
function validateCode(code) {
  if(typeof code!=="string"||!code.trim()) throw new TypeError("code must be a non-empty string.");
  if(code.length>50000) throw new RangeError("code exceeds 50,000 characters.");
}
export function analyzeCode({code,language,filename=""}={}) {
  validateCode(code);
  const lang=detectLanguage(language,filename),diagnostics=[];
  for(const rule of RULES) {
    if(rule.languages&&!rule.languages.includes(lang)) continue;
    for(const m of matches(code,rule.pattern)) diagnostics.push({ruleId:rule.id,severity:rule.severity,message:rule.message,suggestion:rule.suggestion,...lineColumn(code,m.index)});
  }
  if(["javascript","typescript","java","cpp","csharp"].includes(lang)) {
    const opens=(code.match(/\{/g)||[]).length,closes=(code.match(/\}/g)||[]).length;
    if(opens!==closes) diagnostics.push({ruleId:"brace-balance",severity:"warning",message:"Opening and closing brace counts differ.",suggestion:"Check blocks, object literals, and template expressions.",line:null,column:null});
  }
  const lines=code.split("\n");
  return {language:lang,summary:{lines:lines.length,nonEmptyLines:lines.filter(x=>x.trim()).length,characters:code.length},diagnostics,counts:{critical:diagnostics.filter(x=>x.severity==="critical").length,warning:diagnostics.filter(x=>x.severity==="warning").length,info:diagnostics.filter(x=>x.severity==="info").length},limitations:["Static pattern checks only; code was not executed.","Not a replacement for a compiler, full security audit, or human review."]};
}
export function explainCode(input={}) {
  const a=analyzeCode(input),lines=input.code.split("\n");
  return {language:a.language,summary:a.summary,overview:"A source-level overview only. Runtime behavior has not been executed or verified.",openingLines:lines.slice(0,12),diagnostics:a.diagnostics};
}
export function createTestPlan(input={}) {
  const a=analyzeCode(input);
  return {language:a.language,execution:"suggestions-only",cases:["Typical valid input","Empty or missing input","Boundary and unusually large input","Invalid types and malformed data","Error handling and recovery","Permissions and untrusted-input handling"],diagnosticsToCover:a.diagnostics.map(({ruleId,line,message})=>({ruleId,line,message}))};
}
export function createProjectPlan({goal,files=[]}={}) {
  if(typeof goal!=="string"||!goal.trim()) throw new TypeError("goal is required.");
  if(!Array.isArray(files)||files.length>100||files.some(x=>typeof x!=="string")) throw new TypeError("files must be an array of up to 100 paths.");
  return {goal:goal.trim().slice(0,2000),knownFiles:files,steps:["Inspect relevant files and project conventions.","Break the goal into small, reviewable changes.","Implement the changes across the required files.","Add or update focused tests.","Run the project's test and build commands.","Review the diff, permissions, and secret handling."],execution:"plan-only",requiresRepositoryAccess:true};
}
export const SUPPORTED_CODE_LANGUAGES=Object.freeze(Object.keys(LANGUAGES));
