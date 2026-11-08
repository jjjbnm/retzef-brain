const domains = [
  { key:"hebrew", label:"עברית", name:"Hebrew", desc:"מודל ניסיוני שאומן על קורפוס עברי של Retzef." },
  { key:"general", label:"כללי", name:"General", desc:"מודל ניסיוני לשפה כללית שאומן על קורפוס Retzef." },
  { key:"code", label:"קוד", name:"Code", desc:"מודל ניסיוני לטקסט תכנות וקוד שאומן על קורפוס Retzef." }
];
const architectures = [
  { key:"ngram", label:"N-gram", suffix:"", desc:"חיזוי הטוקן הבא על בסיס רצפי מילים." },
  { key:"neural", label:"Neural", suffix:"-neural", desc:"רשת עצבית קטנה עם embeddings ושכבת חיזוי." },
  { key:"subword", label:"Subword", suffix:"-subword", desc:"רשת עצבית ניסיונית הלומדת תווים וחלקי מילים." }
];
export default function handler(req,res){
  res.setHeader("Cache-Control","no-store");
  if(req.method!=="GET") return res.status(405).json({error:"Method not allowed"});
  const list=[];
  for(const a of architectures) for(const d of domains) list.push({
    id:"retzef-"+d.key+a.suffix,
    name:"Retzef "+d.name+(a.suffix?" "+a.label:""),
    architecture:a.key,architectureLabel:a.label,domain:d.key,domainLabel:d.label,
    description:d.desc+" "+a.desc,status:"experimental",owner:"Retzef"
  });
  return res.status(200).json({brand:"Retzef",models:list,count:list.length});
}