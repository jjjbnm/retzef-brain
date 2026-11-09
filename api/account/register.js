import { registerAccount, createAccountSession, sessionCookie, validateUsername } from "../../brain/account-store.js";
export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store"); res.setHeader("X-Content-Type-Options", "nosniff");
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  let body=req.body; if(typeof body==="string"){try{body=JSON.parse(body)}catch{return res.status(400).json({error:"JSON לא תקין."})}}
  const username=typeof body?.username==="string"?body.username.trim():"";
  const displayName=typeof body?.displayName==="string"?body.displayName.trim():username;
  const password=typeof body?.password==="string"?body.password:"";
  if(!validateUsername(username)) return res.status(400).json({error:"שם המשתמש חייב להכיל 3–24 תווים באנגלית, מספרים או קו תחתון."});
  if(displayName.length<2||displayName.length>32) return res.status(400).json({error:"השם לתצוגה חייב להכיל 2–32 תווים."});
  if(password.length<8||password.length>128) return res.status(400).json({error:"הסיסמה חייבת להכיל לפחות 8 תווים ועד 128."});
  try { const user=await registerAccount({username,displayName,password}); const session=await createAccountSession(user.id); res.setHeader("Set-Cookie",sessionCookie(session.token)); return res.status(201).json({ok:true,user}); }
  catch(error){if(error.code==="USERNAME_TAKEN")return res.status(409).json({error:error.message}); console.error("Account registration failed:",String(error?.message||error)); return res.status(500).json({error:"לא ניתן ליצור חשבון כרגע. בדקו את חיבור מסד הנתונים."});}
}
