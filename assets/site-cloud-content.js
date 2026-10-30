import {getPublished} from './supabase-client.js';
const sections=['banner','news','menu','store','recruitment','contact'];
async function run(){
 const results=await Promise.allSettled(sections.map(s=>getPublished(s)));
 const payload={};
 let failures=0;
 results.forEach((r,i)=>{if(r.status==='fulfilled')payload[sections[i]]=r.value;else{failures++;console.warn('CMS '+sections[i]+' fetch failed',r.reason)}});
 if(failures===sections.length)return;
 if(typeof window.thwApplyCloudContent==='function')window.thwApplyCloudContent(payload);
}
run().catch(e=>console.warn('Cloud website content unavailable; preserving static site',e));
