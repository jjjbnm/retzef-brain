import test from "node:test";import assert from "node:assert/strict";import{createDefaultPluginRegistry}from"../brain/plugins/registry.js";
test("calculator",async()=>{const r=createDefaultPluginRegistry();assert.equal((await r.execute("calculator",{expression:"12*(3+4)"})).result.value,84)});
test("calculator rejects code and division by zero",async()=>{const r=createDefaultPluginRegistry();await assert.rejects(()=>r.execute("calculator",{expression:"process.exit()"}));await assert.rejects(()=>r.execute("calculator",{expression:"1/0"}))});
test("text analyzer",async()=>{const r=createDefaultPluginRegistry(),x=await r.execute("text-analyzer",{text:"שלום עולם\nRetzef"});assert.equal(x.result.words,3);assert.equal(x.result.lines,2)});
test("plugin draft is non-executable",async()=>{const r=createDefaultPluginRegistry(),x=await r.execute("plugin-draft-builder",{id:"draft-one",name:"Draft",description:"Test"});assert.equal(x.result.manifest.executable,false)});
