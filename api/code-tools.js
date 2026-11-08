import {analyzeCode,explainCode,createTestPlan,createProjectPlan,SUPPORTED_CODE_LANGUAGES} from "../brain/code-engine.js";
export default function handler(req,res) {
  res.setHeader("Cache-Control","no-store");
  if(req.method==="GET") return res.status(200).json({name:"Retzef Code Tools",languages:SUPPORTED_CODE_LANGUAGES,actions:["analyze","explain","test-plan","project-plan"],execution:"static-analysis-and-planning"});
  if(req.method!=="POST") return res.status(405).json({error:"Method not allowed."});
  let body=req.body;
  if(typeof body==="string") {try{body=JSON.parse(body)}catch{return res.status(400).json({error:"Invalid JSON."})}}
  try {
    const action=typeof body?.action==="string"?body.action:"analyze";
    const result=action==="analyze"?analyzeCode(body):action==="explain"?explainCode(body):action==="test-plan"?createTestPlan(body):action==="project-plan"?createProjectPlan(body):null;
    if(!result) return res.status(400).json({error:"Unknown action.",supported:["analyze","explain","test-plan","project-plan"]});
    return res.status(200).json({ok:true,tool:"retzef-code",action,result});
  } catch(error) {
    return res.status(error instanceof RangeError?413:400).json({error:String(error?.message||"Retzef Code request failed").slice(0,220)});
  }
}
