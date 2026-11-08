const translations = {
en: {
navModels:"Models",navTech:"Technology",navRoadmap:"Roadmap",navAbout:"About",
eyebrow:"Independent AI research lab",heroTitle:'A new brain.<br><span>New possibilities.</span>',
heroText:"Retzef Brain is an experimental project building language models from scratch — one step at a time, in open source.",
explore:"Explore models",source:"View source",openSource:"Open source",scroll:"Scroll to explore",
statFamilies:"Model families",statModels:"Experimental model profiles",statStack:"Built with JavaScript",statIdeas:"Ideas ahead",
modelsTitle:"Meet the family",modelsIntro:"Three experimental approaches, each with a different goal. Open a card to explore its architecture.",
ngramDesc:"Small text models based on word sequences and patterns learned from separate corpora.",
neuralDesc:"A small neural network with embeddings, a hidden layer and softmax next-token prediction.",
subwordDesc:"An experimental neural model learning characters and word pieces, including spaces and punctuation.",
honestNote:"Note: these are small educational prototypes, not ChatGPT-level models. Outputs may be repetitive or incorrect.",
techTitle:'Start with the basics.<br><span>Learn by building.</span>',techText:"The goal is to understand and build the building blocks of a language model: tokenization, embeddings, prediction, training and saving weights.",
readDocs:"Explore all GitHub documentation ↗",stack1:"Split text into learning units",stack2:"Numeric representations of units",stack3:"Compute and predict the next token",stack4:"Backpropagation + SGD",stack5:"Future research direction",planned:"Planned",
roadTitle:"The journey is just beginning",roadIntro:"Build gradually, test each stage and improve based on results.",
road1:"Engine foundations",road1d:"Catalog, model registry and custom instruction support.",road2:"Neural models",road2d:"Train small models from scratch and save weights.",road3:"Engine integration",road3d:"A unified interface to select, load and run models.",road4:"Advanced research",road4d:"Better datasets, evaluation and new architectures.",
ctaTitle:"Want to see how it's built?",ctaText:"Code, documentation and progress are available in the open repository.",githubCta:"Open Retzef Brain on GitHub ↗",footer:"Experimental open-source project · Built with curiosity."
},
he: {
navModels:"מודלים",navTech:"טכנולוגיה",navRoadmap:"מפת דרכים",navAbout:"אודות",
eyebrow:"מעבדת בינה מלאכותית עצמאית",heroTitle:'מוח חדש.<br><span>אפשרויות חדשות.</span>',
heroText:"Retzef Brain הוא פרויקט ניסיוני לבניית מודלים לשוניים מאפס — צעד אחר צעד, בקוד פתוח.",
explore:"גלו את המודלים",source:"צפו בקוד",openSource:"קוד פתוח",scroll:"גללו כדי לגלות",
statFamilies:"משפחות מודלים",statModels:"פרופילי מודלים ניסיוניים",statStack:"מימוש ב־JavaScript",statIdeas:"רעיונות להמשך",
modelsTitle:"הכירו את המשפחה",modelsIntro:"שלוש גישות ניסיוניות, כל אחת עם מטרה אחרת. בחרו כרטיס כדי לקרוא על הארכיטקטורה.",
ngramDesc:"מודלי טקסט קטנים המבוססים על רצפי מילים ותבניות שנלמדו מקורפוסים נפרדים.",
neuralDesc:"רשת עצבית קטנה עם embeddings, שכבה חבויה וחיזוי הטוקן הבא באמצעות softmax.",
subwordDesc:"מודל עצבי ניסיוני שלומד תווים וחלקי מילים, כולל רווחים וסימני פיסוק.",
honestNote:"חשוב לדעת: אלו אבות־טיפוס לימודיים קטנים, לא מודלים ברמת ChatGPT. התשובות עשויות להיות חוזרות או שגויות.",
techTitle:'מתחילים מהיסודות.<br><span>לומדים דרך בנייה.</span>',techText:"המטרה היא להבין ולבנות את אבני הבניין של מודל שפה: טוקניזציה, embeddings, חיזוי, אימון ושמירת משקולות.",
readDocs:"לכל התיעוד ב־GitHub ↗",stack1:"פירוק טקסט ליחידות למידה",stack2:"ייצוג מספרי של יחידות",stack3:"חישוב וחיזוי הטוקן הבא",stack4:"Backpropagation + SGD",stack5:"כיוון מחקר עתידי",planned:"בתכנון",
roadTitle:"המסע רק מתחיל",roadIntro:"בונים בהדרגה, בודקים כל שלב ומשפרים על בסיס תוצאות.",
road1:"בסיס המנוע",road1d:"קטלוג, רישום מודלים ותמיכה בהוראות מותאמות.",road2:"מודלים עצביים",road2d:"אימון מודלים קטנים מאפס ושמירת משקולות.",road3:"חיבור למנוע",road3d:"ממשק אחיד לבחירה, טעינה והרצת מודלים.",road4:"מחקר מתקדם",road4d:"נתונים טובים יותר, הערכה וארכיטקטורות חדשות.",
ctaTitle:"רוצים לראות איך זה נבנה?",ctaText:"הקוד, התיעוד וההתקדמות זמינים במאגר הפתוח.",githubCta:"פתחו את Retzef Brain ב־GitHub",footer:"פרויקט ניסיוני בקוד פתוח · נבנה בסקרנות."
}
};
let language = "he";
const languageButton = document.querySelector("#language");
languageButton.addEventListener("click", () => {
 language = language === "he" ? "en" : "he";
 document.documentElement.lang = language;
 document.documentElement.dir = language === "he" ? "rtl" : "ltr";
 document.body.dir = language === "he" ? "rtl" : "ltr";
 Object.entries(translations[language]).forEach(([key,value]) => {
   const element = document.querySelector('[data-i18n="' + key + '"]');
   if (element) element.innerHTML = value;
 });
 languageButton.textContent = language === "he" ? "EN" : "עב";
});
document.querySelector("#menu").addEventListener("click", () => document.querySelector(".nav").classList.toggle("open"));
document.querySelectorAll(".nav a").forEach(link => link.addEventListener("click", () => document.querySelector(".nav").classList.remove("open")));
