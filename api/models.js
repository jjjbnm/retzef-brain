const domains=[
 {key:"hebrew",label:"עברית",name:"Hebrew",desc:"מודל ניסיוני שאומן על קורפוס עברי של Retzef."},
 {key:"general",label:"כללי",name:"General",desc:"מודל ניסיוני לשפה כללית שאומן על קורפוס Retzef."},
 {key:"code",label:"קוד",name:"Code",desc:"מודל ניסיוני לטקסט תכנות וקוד שאומן על קורפוס Retzef."}
];
const architectures=[
 {key:"ngram",label:"N-gram",suffix:"",desc:"חיזוי טוקנים על בסיס רצפים."},
 {key:"neural",label:"Neural",suffix:"-neural",desc:"רשת עצבית קטנה עם embeddings."},
 {key:"subword",label:"Subword",suffix:"-subword",desc:"רשת עצבית ניסיונית לחלקי מילים."}
];
export default function handler(req,res){
 res.setHeader("Cache-Control","no-store");if(req.method!=="GET")return res.status(405).json({error:"Method not allowed"});
 const list=[];for(const a of architectures)for(const d of domains)list.push({
  id:"retzef-"+d.key+a.suffix,name:"Retzef "+d.name+(a.suffix?" "+a.label:""),
  architecture:a.key,architectureLabel:a.label,domain:d.key,domainLabel:d.label,
  description:d.desc+" "+a.desc,status:"experimental",owner:"Retzef",
  pluginSupport:{protocol:"openai-tools",available:true,nativeToolCalling:false,requiresBrainOrchestrator:true}
 });
 return res.status(200).json({brand:"Retzef",models:list,count:list.length,pluginProtocol:"openai-tools",pluginProviders:["github","vercel","youtube","tiktok","discord"]});
}
