import { getAccountFromRequest, readSessionCookie, getAccountSession } from "../../brain/account-store.js";
import { claimLegacyApiKeys, validOwnerId } from "../../brain/key-store.js";
import { claimLegacyTrainingData } from "../../brain/training-store.js";
export default async function handler(req,res){
 res.setHeader("Cache-Control","no-store");if(req.method!=="POST")return res.status(405).json({error:"Method not allowed"});
 let body=req.body;if(typeof body==="string"){try{body=JSON.parse(body)}catch{return res.status(400).json({error:"Invalid JSON"})}}
 try{const account=await getAccountFromRequest(req);if(!account)return res.status(401).json({error:"Not signed in"});const legacy=body?.ownerId;if(!validOwnerId(legacy)||legacy===account.id)return res.status(200).json({ok:true,migrated:0});const keys=await claimLegacyApiKeys(legacy,account.id);let examples=0;try{examples=await claimLegacyTrainingData(legacy,account.id)}catch(error){if(!String(error?.message||"").includes("does not exist"))throw error;}return res.status(200).json({ok:true,migrated:keys,trainingExamples:examples});}
 catch(error){console.error("Legacy account data claim failed:",String(error?.message||error));return res.status(500).json({error:"לא ניתן להעביר נתונים ישנים כרגע."});}
}
