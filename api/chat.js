import { readFile } from "node:fs/promises";
import { RetzefNgramModel } from "../src/model.js";
import { RetzefNeuralModel } from "../src/neural-model.js";
import { RetzefSubwordNeuralModel } from "../src/subword-neural-model.js";

const cache = new Map();
const definitions = {
  hebrew:{file:"retzef-hebrew.txt",domain:"Hebrew"},
  general:{file:"retzef-general.txt",domain:"General"},
  code:{file:"retzef-code.txt",domain:"Code"}
};
export async function getModel(id){
  if(cache.has(id)) return cache.get(id);
  const match=id.match(/^retzef-(hebrew|general|code)(-neural|-subword)?$/);
  if(!match) throw new Error("Unknown Retzef model.");
  const [,domain,suffix=""]=match,def=definitions[domain];
  const corpus=await readFile(new URL("../data/corpora/"+def.file,import.meta.url),"utf8");
  let model,stats;
  if(suffix==="-neural"){model=new RetzefNeuralModel({embeddingSize:8,hiddenSize:12,contextSize:2});stats=model.train(corpus,{epochs:3});}
  else if(suffix==="-subword"){model=new RetzefSubwordNeuralModel({embeddingSize:8,hiddenSize:12,contextSize:6});stats=model.train(corpus,{epochs:3});}
  else{model=new RetzefNgramModel({order:3,maxTokens:48});stats=model.train(corpus);}
  const entry={model,stats,architecture:suffix==="-neural"?"Neural":suffix==="-subword"?"Subword":"N-gram",domain:def.domain};
  cache.set(id,entry);return entry;
}
export default async function handler(req,res){
  res.setHeader("Cache-Control","no-store");
  if(req.method!=="POST") return res.status(405).json({error:"Method not allowed"});
  let body=req.body;if(typeof body==="string"){try{body=JSON.parse(body)}catch{return res.status(400).json({error:"Invalid JSON."})}}
  const modelId=typeof body?.modelId==="string"?body.modelId:"";
  const prompt=typeof body?.prompt==="string"?body.prompt.trim():"";
  if(!prompt||prompt.length>3000) return res.status(400).json({error:"ההודעה חייבת להכיל 1–3,000 תווים."});
  try{const entry=await getModel(modelId);const answer=entry.model.generate(prompt,{maxTokens:48});return res.status(200).json({answer,model:"Retzef "+entry.domain+" "+entry.architecture,stats:"נוצרו "+(entry.stats?.tokens||entry.stats?.trainedTokens||0)+" טוקנים"})}
  catch(error){return res.status(500).json({error:String(error?.message||"Retzef model failed").slice(0,220)})}
}
