const obj=(properties,required=[])=>({type:"object",properties,required,additionalProperties:false});
const str=(description)=>({type:"string",description});
const num=(description,minimum=1,maximum=50)=>({type:"integer",minimum,maximum,description});
export const PLUGIN_PROVIDERS=[
 {id:"github",name:"GitHub",description:"עבודה עם repositories, issues ומידע על קוד.",auth:{type:"oauth",scopes:["read:user","repo metadata read"]},tools:[
  {name:"github_search_repositories",description:"Search GitHub repositories visible to the connected user.",parameters:obj({query:str("Search query for repositories."),per_page:num("Maximum results.",1,30)},["query"])},
  {name:"github_get_repository",description:"Get metadata for a repository the connected user can access.",parameters:obj({owner:str("Repository owner."),repo:str("Repository name.")},["owner","repo"])},
  {name:"github_list_issues",description:"List issues in a repository. Does not create or modify issues.",parameters:obj({owner:str("Repository owner."),repo:str("Repository name."),state:{type:"string",enum:["open","closed","all"],description:"Issue state."}},["owner","repo"])}
 ]},
 {id:"vercel",name:"Vercel",description:"בדיקת Projects, Deployments וסטטוס פריסה.",auth:{type:"oauth",scopes:["read projects","read deployments"]},tools:[
  {name:"vercel_list_projects",description:"List projects in the connected Vercel account.",parameters:obj({limit:num("Maximum projects.",1,50)})},
  {name:"vercel_list_deployments",description:"List deployments for a Vercel project.",parameters:obj({projectId:str("Vercel project ID or project name."),limit:num("Maximum deployments.",1,30)},["projectId"])},
  {name:"vercel_get_deployment",description:"Get status and details of a deployment.",parameters:obj({deploymentId:str("Deployment ID or URL.")},["deploymentId"])}
 ]},
 {id:"youtube",name:"YouTube",description:"חיפוש סרטונים וקריאת מידע על ערוצים וסרטונים.",auth:{type:"oauth",scopes:["youtube.readonly"]},tools:[
  {name:"youtube_search_videos",description:"Search public YouTube videos by query.",parameters:obj({query:str("Search phrase."),maxResults:num("Maximum results.",1,25)},["query"])},
  {name:"youtube_get_channel",description:"Get public information about a YouTube channel by handle.",parameters:obj({handle:str("Channel handle, with or without @.")},["handle"])},
  {name:"youtube_list_channel_videos",description:"List recent public videos from a YouTube channel.",parameters:obj({channelId:str("YouTube channel ID."),maxResults:num("Maximum results.",1,25)},["channelId"])}
 ]},
 {id:"tiktok",name:"TikTok",description:"קריאת פרטי החשבון והסרטונים הציבוריים של המשתמש המחובר.",auth:{type:"oauth",scopes:["user.info.basic","user.info.stats","video.list"]},tools:[
  {name:"tiktok_get_my_profile",description:"Get profile and statistics for the connected TikTok account only.",parameters:obj({includeStats:{type:"boolean",description:"Include follower, following, likes and video counts."}})},
  {name:"tiktok_list_my_videos",description:"List the connected user's public TikTok videos. Does not publish content.",parameters:obj({maxCount:num("Maximum videos.",1,20)})}
 ]},
 {id:"discord",name:"Discord",description:"קריאת פרטי המשתמש ורשימת השרתים שבהם הוא חבר.",auth:{type:"oauth",scopes:["identify","guilds"]},tools:[
  {name:"discord_get_my_user",description:"Get the connected Discord user's profile.",parameters:obj({})},
  {name:"discord_list_my_servers",description:"List Discord servers the connected user belongs to.",parameters:obj({limit:num("Maximum servers.",1,100)})}
 ]}
];
export function getPluginCatalog(){return PLUGIN_PROVIDERS.map(p=>({...p,connection:{status:"not_connected",mode:"user_oauth"},tools:p.tools.map(t=>({...t,readOnly:true,requiresApproval:false}))}));}
export function getOpenAIToolDefinitions(providerIds=[]){
 const selected=new Set(providerIds);
 return PLUGIN_PROVIDERS.filter(p=>selected.has(p.id)).flatMap(p=>p.tools.map(t=>({type:"function",function:{name:t.name,description:t.description,parameters:t.parameters}})));
}
export function findPluginTool(name){for(const p of PLUGIN_PROVIDERS){const tool=p.tools.find(t=>t.name===name);if(tool)return{provider:p.id,tool};}return null;}
