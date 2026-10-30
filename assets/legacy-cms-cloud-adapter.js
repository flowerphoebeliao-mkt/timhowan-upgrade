import {cloudWrite,cloudDelete,cloudRead} from './cms-cloud-actions.js';
// Original CMS adapter: explicit authenticated cloud actions. Never stores credentials.
import {db,getEditorial,saveContent,getMyRole} from './supabase-client.js';
const sectionMap={banners:'banner',news:'news',menu:'menu',stores:'store',pages:'recruitment'};
const sectionNames={banners:'首頁 Banner',news:'最新消息',menu:'美味菜單',stores:'門市據點',pages:'頁面'};
const keys=['banners','news','menu','stores'];
function notify(s,error=false){const el=document.getElementById('cloud-status');if(el){el.textContent=s;el.style.color=error?'#a32626':'#006747'}}
function makeSlug(k,item){return k+'-'+String(item.id).replace(/[^a-zA-Z0-9_-]/g,'')}
function itemToRow(k,item){const {id,published,...data}=item;return {section:sectionMap[k],slug:makeSlug(k,item),title:item.title||'',sort_order:Number(item.order)||0,status:published?'published':'draft',data:{...data,legacy_id:id}}}
function rowToItem(row){return {id:row.data?.legacy_id||row.slug,title:row.title,published:row.status==='published',order:row.sort_order,...row.data}}
async function requireEditor(){const {data:{user},error}=await db.auth.getUser();if(error||!user)throw new Error('請先登入 Supabase');const role=await getMyRole();if(!['admin','publisher'].includes(role))throw new Error('帳號沒有編輯權限');return role}
async function hydrateAll(){
 await requireEditor();
 let count=0;
 for(const k of keys){
  const rows=await cloudRead(k);
  if(rows.length){window.thwLegacyCms.replaceItems(k,rows);count+=rows.length}
 }
 notify('已從 Supabase 載入 '+count+' 筆內容。儲存、發布及下架會同步雲端。');
}
async function login(){const email=document.getElementById('cloud-email').value.trim(),password=document.getElementById('cloud-password').value;const {error}=await db.auth.signInWithPassword({email,password});if(error)throw error;await hydrateAll()}
async function uploadOne(k,item){return cloudWrite(k,item)}
async function pushAll(){await requireEditor();const payload=window.thwLegacyCms;const k=payload.getSection();if(!keys.includes(k))throw new Error('請先進入 Banner／最新消息／菜單／門市列表');if(!confirm('將目前「'+sectionNames[k]+'」的本機內容寫入雲端（不會自動刪除雲端其他資料）。確定繼續？'))return;let n=0;for(const item of payload.getItems(k)){await uploadOne(k,item);n++}notify('已寫入雲端 '+n+' 筆。發布狀態由 Supabase 控制。')}
async function pullSection(){await requireEditor();const payload=window.thwLegacyCms;const k=payload.getSection();if(!keys.includes(k))throw new Error('請先進入可同步的內容列表');const rows=await getEditorial(sectionMap[k]);if(!confirm('從雲端讀取 '+rows.length+' 筆「'+sectionNames[k]+'」並覆蓋此瀏覽器的同分類資料？請先備份。'))return;payload.replaceItems(k,rows.map(rowToItem));notify('已從雲端載入 '+rows.length+' 筆，請確認列表。')}
async function run(fn){try{notify('處理中…');await fn()}catch(e){notify('操作失敗：'+e.message,true)}}
window.thwCloud={write:cloudWrite,remove:cloudDelete,read:cloudRead,authorize:requireEditor};
function init(){const bar=document.createElement('div');bar.style.cssText='position:relative;z-index:2;background:#edf5ee;padding:12px 18px;border-bottom:1px solid #c9dfcd;display:flex;gap:8px;flex-wrap:wrap;align-items:center';bar.innerHTML='<strong>Supabase 雲端內容管理</strong> <input id="cloud-email" type="email" autocomplete="username" placeholder="管理員 Email" style="padding:8px;width:200px"> <input id="cloud-password" type="password" autocomplete="current-password" placeholder="密碼" style="padding:8px;width:160px"> <button type="button" id="cloud-login" class="btn">雲端登入</button> <button type="button" id="cloud-push" class="btn">首次匯入目前分類</button> <button type="button" id="cloud-pull" class="btn">從雲端載入目前分類</button> <span id="cloud-status" role="status" style="font-size:12px">登入後儲存／發布／下架會寫入雲端。</span>';document.body.prepend(bar);
 const demoWarning=[...document.querySelectorAll('p,small,div')].find(el=>el.children.length===0&&el.textContent.includes('此為可操作的 CMS Demo'));
 if(demoWarning)demoWarning.textContent='雲端內容管理：請先在上方登入 Supabase；編輯與發布會同步至雲端。未登入前，請勿將本機示範資料視為已發布。';
 bar.querySelector('#cloud-login').onclick=()=>run(login);bar.querySelector('#cloud-push').onclick=()=>run(pushAll);bar.querySelector('#cloud-pull').onclick=()=>run(pullSection);db.auth.getUser().then(({data:{user}})=>{if(user)run(hydrateAll)}).catch(()=>{})}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
