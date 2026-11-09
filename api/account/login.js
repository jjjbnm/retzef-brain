import { authenticateAccount, createAccountSession, sessionCookie } from "../../brain/account-store.js";
export default async function handler(req,res){
 res.setHeader("Cache-Control","no-store");res.setHeader("X-Content-Type-Options","nosniff");
 if(req.method!=="POST")return res.status(405).json({error:"Method not allowed"});
 let body=req.body;if(typeof body==="string"){try{body=JSON.parse(body)}catch{return res.status(400).json({error:"JSON לא תקין."})}}
 const username=typeof body?.username==="string"?body.username.trim():"";const password=typeof body?.password==="string"?body.password:"";
 if(!username||!password)return res.status(400).json({error:"יש למלא שם משתמש וסיסמה."});
 try{const user=await authenticateAccount(username,password);if(!user)return res.status(401).json({error:"שם המשתמש או הסיסמה שגויים."});const session=await createAccountSession(user.id);res.setHeader("Set-Cookie",sessionCookie(session.token));return res.status(200).json({ok:true,user});}
 catch(error){console.error("Account login failed:",String(error?.message||error));return res.status(500).json({error:"לא ניתן להתחבר כרגע. נסו שוב מאוחר יותר."});}
}
