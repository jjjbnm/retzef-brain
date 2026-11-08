import test from "node:test";
import assert from "node:assert/strict";
import {analyzeCode,explainCode,createTestPlan,createProjectPlan,SUPPORTED_CODE_LANGUAGES} from "../brain/code-engine.js";
test("detects language from filename",()=>assert.equal(analyzeCode({code:"print('ok')",filename:"main.py"}).language,"python"));
test("finds debug statements and possible credentials",()=>{
 const r=analyzeCode({language:"javascript",code:'const apiKey="abcdefghijklmnop";\ndebugger;\nconsole.log("x");'});
 assert.ok(r.diagnostics.some(x=>x.ruleId==="hard-coded-secret"&&x.severity==="critical"));
 assert.ok(r.diagnostics.some(x=>x.ruleId==="debugger"));
});
test("python exec check is language-specific",()=>assert.equal(analyzeCode({language:"javascript",code:"exec(input);"}).diagnostics.some(x=>x.ruleId==="python-exec"),false));
test("explain does not claim runtime execution",()=>assert.match(explainCode({language:"javascript",code:"let x=1;"}).overview,/not been executed/));
test("test plan returns meaningful cases",()=>assert.ok(createTestPlan({language:"python",code:"def f(x): return x"}).cases.length>=5));
test("project plan is explicitly plan-only",()=>assert.equal(createProjectPlan({goal:"Add login",files:["api/login.js"]}).execution,"plan-only"));
test("rejects empty and oversized code",()=>{assert.throws(()=>analyzeCode({code:""}));assert.throws(()=>analyzeCode({code:"x".repeat(50001)}));});
test("supports common languages",()=>{assert.ok(SUPPORTED_CODE_LANGUAGES.includes("typescript"));assert.ok(SUPPORTED_CODE_LANGUAGES.includes("python"));});
