import{findPluginTool}from"../brain/plugins/catalog.js";
import{createDefaultPluginRegistry}from"../brain/plugins/registry.js";
const builtins=createDefaultPluginRegistry();
export default async function handler(req,res){
 res.setHeader("Cache-Control","no-store");
 if(req.method!=="POST")return res.status(405).json({error:"Method not allowed"});
 let body=req.body;if(typeof body==="string"){try{body=JSON.parse(body)}catch{return res.status(400).json({error:"Invalid JSON."})}}
 const name=typeof body?.toolName==="string"?body.toolName:typeof body?.pluginId==="string"?body.pluginId:"";
 if(name.startsWith("github_")||name.startsWith("vercel_")||name.startsWith("youtube_")||name.startsWith("tiktok_")||name.startsWith("discord_")){
  const match=findPluginTool(name);if(!match)return res.status(404).json({ok:false,code:"UNKNOWN_TOOL",error:"Unknown external plugin tool."});
  return res.status(503).json({ok:false,code:"USER_CONNECTION_REQUIRED",provider:match.provider,error:"This provider is listed in the Retzef tool catalog, but user-scoped OAuth execution has not been configured yet. No external action was performed."});
 }
 try{return res.status(200).json({ok:true,...await builtins.execute(name,body?.input??body?.arguments??{})})}
 catch(e){return res.status(400).json({ok:false,error:String(e?.message||"Plugin failed").slice(0,220)})}
}
