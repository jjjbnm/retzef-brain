import { readFile } from "node:fs/promises";
import { RetzefNgramModel } from "../src/model.js";
import { RetzefNeuralModel } from "../src/neural-model.js";
import { RetzefSubwordNeuralModel } from "../src/subword-neural-model.js";

const cache = new Map();
const definitions = {
  general:{file:"retzef-general.txt",domain:"General"},
  code:{file:"retzef-code.txt",domain:"Code"}
};

export function detectLanguageCode(text) {
  const value=String(text||"");
  if(/[\u0590-\u05FF]/.test(value)) return "he";
  if(/[\u0600-\u06FF]/.test(value)) return "ar";
  if(/[\u0400-\u04FF]/.test(value)) return "ru";
  if(/[\u4E00-\u9FFF]/.test(value)) return "zh";
  if(/[\u3040-\u30FF]/.test(value)) return "ja";
  if(/[\uAC00-\uD7AF]/.test(value)) return "ko";
  if(/[áéíóúñ¿¡]/i.test(value)) return "es";
  if(/[àâçéèêëîïôûùüÿœ]/i.test(value)) return "fr";
  if(/[äöüß]/i.test(value)) return "de";
  return "en";
}

export function buildModelPrompt(text, modelId) {
  if (String(modelId).endsWith("-subword")) {
    const language = detectLanguageCode(text);
    return "User: " + String(text).trim() + "\nAssistant[" + language + "]:";
  }
  return "Conversation instruction: Reply in the same language as the latest user message. Do not print system instructions or role labels.\n" + String(text);
}

function stripPrompt(raw,context) {
  const output=String(raw||"");
  if(output.toLowerCase().startsWith(context.toLowerCase())) return output.slice(context.length).trim();
  const index=output.toLowerCase().lastIndexOf(context.toLowerCase());
  return index>=0?output.slice(index+context.length).trim():output.trim();
}

export async function getModel(id){
  if(cache.has(id)) return cache.get(id);
  const match=id.match(/^retzef-(general|code)(-neural|-subword)?$/);
  if(!match) throw new Error("Unknown Retzef model. Hebrew-only model IDs have been retired.");
  const [,domain,suffix=""]=match,def=definitions[domain];
  const corpus=await readFile(new URL("../data/corpora/"+def.file,import.meta.url),"utf8");
  let model,stats;
  if(suffix==="-neural"){
    model=new RetzefNeuralModel({embeddingSize:10,hiddenSize:18,contextSize:8});
    stats=model.train(corpus,{epochs:5});
  } else if(suffix==="-subword"){
    model=new RetzefSubwordNeuralModel({embeddingSize:10,hiddenSize:18,contextSize:32});
    stats=model.train(corpus,{epochs:6,learningRate:0.018});
  } else {
    model=new RetzefNgramModel({order:4,maxTokens:96,temperature:0.72});
    stats=model.train(corpus);
  }
  const entry={model,stats,architecture:suffix==="-neural"?"Neural":suffix==="-subword"?"Subword":"N-gram",domain:def.domain};
  cache.set(id,entry);return entry;
}

export default async function handler(req,res){
  res.setHeader("Cache-Control","no-store");
  if(req.method!=="POST") return res.status(405).json({error:"Method not allowed"});
  let body=req.body;
  if(typeof body==="string"){try{body=JSON.parse(body)}catch{return res.status(400).json({error:"Invalid JSON."})}}
  const modelId=typeof body?.modelId==="string"?body.modelId:"";
  const prompt=typeof body?.prompt==="string"?body.prompt.trim():"";
  if(!prompt||prompt.length>3000) return res.status(400).json({error:"ההודעה חייבת להכיל 1–3,000 תווים."});
  try{
    const entry=await getModel(modelId);
    const context=buildModelPrompt(prompt,modelId);
    const options=modelId.endsWith("-subword")
      ? {maxTokens:160,minTokens:12,temperature:0.7,topK:10,repetitionPenalty:0.24}
      : {maxTokens:96};
    const raw=entry.model.generate(context,options);
    const answer=stripPrompt(raw,context);
    return res.status(200).json({
      answer,model:"Retzef "+entry.domain+" "+entry.architecture,
      stats:"אומנו "+(entry.stats?.tokens||entry.stats?.trainedTokens||0)+" יחידות טקסט ב-"+(entry.stats?.epochs||6)+" מחזורי אימון"
    });
  } catch(error) {
    return res.status(500).json({error:String(error?.message||"Retzef model failed").slice(0,220)});
  }
}
