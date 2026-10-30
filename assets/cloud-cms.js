import {db,signIn,signOut,getMyRole,getEditorial,saveContent} from './supabase-client.js';
const $=id=>document.getElementById(id);
let role=null,editId=null;
const mimeExt={'image/jpeg':'jpg','image/png':'png','image/webp':'webp'};
const editable=()=>role==='admin'||role==='publisher';
const say=(msg)=>{$('message').textContent=msg};
const statusText={draft:'草稿',published:'已發布',archived:'已下架'};
const sections=new Set(['banner','brand_story','news','menu','store','recruitment','contact','site_settings']);
function el(tag,text){const node=document.createElement(tag);node.textContent=text;return node}
async function syncSession(){
 try{
  const {data:{user}}=await db.auth.getUser();
  role=user?await getMyRole():null;
  $('loginPanel').hidden=!!role;$('adminPanel').hidden=!role;
  $('editorPanel').hidden=true;
  if(!role){say(user?'此帳號沒有 CMS 權限，請由管理員在 cms_members 授權。':'請登入。');return}
  $('identity').textContent=user.email+'｜'+({admin:'系統管理員',publisher:'編輯與發布',viewer:'唯讀'}[role]);
  $('new').disabled=!editable();
  $('section').querySelector('[value="site_settings"]').disabled=role!=='admin';
  if(role!=='admin'&&$('section').value==='site_settings')$('section').value='news';
  await load();
 }catch(e){say('登入狀態檢查失敗：'+e.message)}
}
async function load(){
 try{
  const section=$('section').value;
  if(!sections.has(section))throw Error('無效的分類');
  const rows=await getEditorial(section);
  const host=$('items');host.replaceChildren();
  if(!rows.length)host.append(el('p','此分類尚無雲端資料。原版 CMS 的本機示範資料尚未匯入。'));
  for(const row of rows){
   const wrap=el('div','');wrap.className='item';
   const desc=el('div','');desc.append(el('strong',row.title||row.slug),el('small','　'+row.slug+'｜'+(statusText[row.status]||row.status)));
   const btn=el('button',editable()?'編輯':'檢視');btn.className='secondary';btn.addEventListener('click',()=>openEdit(row));
   wrap.append(desc,btn);host.append(wrap);
  }
 }catch(e){say('讀取失敗：'+e.message)}
}
function openEdit(row=null){
 editId=row?.id||null;
 $('editorHeading').textContent=row?'編輯雲端內容':'新增雲端內容';
 $('slug').value=row?.slug||'';$('slug').readOnly=!!row;
 $('title').value=row?.title||'';$('sort').value=row?.sort_order??0;
 $('status').value=row?.status||'draft';
 $('payload').value=JSON.stringify(row?.data||{},null,2);
 $('save').hidden=!editable();$('editorPanel').hidden=false;
 $('editorPanel').scrollIntoView({behavior:'smooth'});
}
$('loginForm').addEventListener('submit',async e=>{
 e.preventDefault();const btn=e.submitter;btn.disabled=true;
 try{await signIn($('email').value,$('password').value);$('password').value='';await syncSession()}
 catch(err){say('登入失敗：'+err.message)}finally{btn.disabled=false}
});
$('logout').addEventListener('click',async()=>{try{await signOut();role=null;await syncSession()}catch(e){say(e.message)}});
$('section').addEventListener('change',load);$('refresh').addEventListener('click',load);
$('new').addEventListener('click',()=>{if(editable())openEdit()});
$('cancel').addEventListener('click',()=>{$('editorPanel').hidden=true});
$('editForm').addEventListener('submit',async e=>{
 e.preventDefault();if(!editable())return say('唯讀角色不可儲存');
 const btn=$('save');btn.disabled=true;
 try{
  const data=JSON.parse($('payload').value);
  if(!data||Array.isArray(data)||typeof data!=='object')throw Error('內容必須是 JSON 物件');
  const row={section:$('section').value,slug:$('slug').value.trim(),title:$('title').value.trim(),sort_order:Number($('sort').value)||0,status:$('status').value,data};
  if(editId)row.id=editId;
  await saveContent(row);say('已儲存至 Supabase：'+row.title+'（'+statusText[row.status]+'）');
  $('editorPanel').hidden=true;await load();
 }catch(err){say('儲存失敗：'+err.message)}finally{btn.disabled=false}
});
$('uploadMedia').addEventListener('click',async()=>{
 if(!editable())return say('沒有圖片上傳權限');
 const file=$('mediaFile').files?.[0];
 if(!file)return say('請先選擇圖片');
 if(!mimeExt[file.type]||file.size>5*1024*1024)return say('僅接受 5 MB 以下的 JPG、PNG、WebP 圖片');
 const btn=$('uploadMedia');btn.disabled=true;
 try{
  const {data:{user},error:authError}=await db.auth.getUser();
  if(authError||!user)throw authError||Error('請先登入');
  const bytes=new Uint8Array(16);crypto.getRandomValues(bytes);
  const id=Array.from(bytes,b=>b.toString(16).padStart(2,'0')).join('');
  const path=user.id+'/'+id+'.'+mimeExt[file.type];
  const {error}=await db.storage.from('cms-media').upload(path,file,{contentType:file.type,upsert:false});
  if(error)throw error;
  const {data}=db.storage.from('cms-media').getPublicUrl(path);
  const payload=JSON.parse($('payload').value);
  if(!payload||Array.isArray(payload)||typeof payload!=='object')throw Error('JSON 必須是物件');
  payload.image_url=data.publicUrl;
  $('payload').value=JSON.stringify(payload,null,2);
  $('mediaResult').textContent='上傳成功，圖片網址已加入 image_url。請按「儲存至雲端」保存內容。';
  say('圖片上傳成功；請儲存內容。');
 }catch(e){say('圖片上傳失敗：'+e.message)}finally{btn.disabled=false}
});
syncSession();
