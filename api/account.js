import { registerAccount, authenticateAccount, createAccountSession, getAccountFromRequest, deleteAccountSession, readSessionCookie, sessionCookie, validateUsername } from "../brain/account-store.js";
import { claimLegacyApiKeys, validOwnerId } from "../brain/key-store.js";
import { claimLegacyTrainingData } from "../brain/training-store.js";
function readBody(req){let body=req.body;if(typeof body==="string"){try{return JSON.parse(body)}catch{return null}}return body||{}}
export default async function handler(req,res){
 res.setHeader("Cache-Control","no-store");res.setHeader("X-Content-Type-Options","nosniff");
 const action=String(req.query?.action||"");
 try{
  if(action==="me"){
   if(req.method!=="GET")return res.status(405).json({error:"Method not allowed"});
   const user=await getAccountFromRequest(req);if(!user)return res.status(401).json({ok:false,error:"Not signed in"});return res.status(200).json({ok:true,user});
  }
  if(action==="logout"){
   if(req.method!=="POST")return res.status(405).json({error:"Method not allowed"});
   await deleteAccountSession(readSessionCookie(req));res.setHeader("Set-Cookie",sessionCookie("",0));return res.status(200).json({ok:true});
  }
  if(action==="claim-legacy"){
   if(req.method!=="POST")return res.status(405).json({error:"Method not allowed"});
   const account=await getAccountFromRequest(req);if(!account)return res.status(401).json({error:"Not signed in"});
   const legacy=readBody(req)?.ownerId;if(!validOwnerId(legacy)||legacy===account.id)return res.status(200).json({ok:true,migrated:0});
   const keys=await claimLegacyApiKeys(legacy,account.id);let examples=0;try{examples=await claimLegacyTrainingData(legacy,account.id)}catch(error){if(!String(error?.message||"").includes("does not exist"))throw error;}
   return res.status(200).json({ok:true,migrated:keys,trainingExamples:examples});
  }
  if(action==="register"){
   if(req.method!=="POST")return res.status(405).json({error:"Method not allowed"});const body=readBody(req);if(!body)return res.status(400).json({error:"JSON לא תקין."});
   const username=typeof body.username==="string"?body.username.trim():"";const displayName=typeof body.displayName==="string"?body.displayName.trim():username;const password=typeof body.password==="string"?body.password:"";
   if(!validateUsername(username))return res.status(400).json({error:"שם המשתמש חייב להכיל 3–24 תווים באנגלית, מספרים או קו תחתון."});
   if(displayName.length<2||displayName.length>32)return res.status(400).json({error:"השם לתצוגה חייב להכיל 2–32 תווים."});
   if(password.length<8||password.length>128)return res.status(400).json({error:"הסיסמה חייבת להכיל לפחות 8 תווים ועד 128."});
   try{const user=await registerAccount({username,displayName,password});const session=await createAccountSession(user.id);res.setHeader("Set-Cookie",sessionCookie(session.token));return res.status(201).json({ok:true,user});}
   catch(error){if(error.code==="USERNAME_TAKEN")return res.status(409).json({error:error.message});throw error;}
  }
  if(action==="login"){
   if(req.method!=="POST")return res.status(405).json({error:"Method not allowed"});const body=readBody(req);if(!body)return res.status(400).json({error:"JSON לא תקין."});
   const username=typeof body.username==="string"?body.username.trim():"";const password=typeof body.password==="string"?body.password:"";if(!username||!password)return res.status(400).json({error:"יש למלא שם משתמש וסיסמה."});
   const user=await authenticateAccount(username,password);if(!user)return res.status(401).json({error:"שם המשתמש או הסיסמה שגויים."});const session=await createAccountSession(user.id);res.setHeader("Set-Cookie",sessionCookie(session.token));return res.status(200).json({ok:true,user});
  }
  return res.status(400).json({error:"Unknown account action."});
 }catch(error){const message=String(error?.message||"");console.error("Retzef account request failed:",message);if(message.includes("not configured")||message.includes("DATABASE_URL"))return res.status(503).json({error:"מסד הנתונים של Retzef Brain אינו מוגדר או אינו זמין."});return res.status(500).json({error:"לא ניתן להשלים את פעולת החשבון כרגע."});}
}
