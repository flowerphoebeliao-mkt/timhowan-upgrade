import {db,getMyRole,saveContent,getEditorial} from './supabase-client.js';
const sections={banners:'banner',news:'news',menu:'menu',stores:'store'};
export async function requireEditor(){
 const {data:{user},error}=await db.auth.getUser();
 if(error||!user)throw Error('請先登入 Supabase');
 const role=await getMyRole();
 if(!['admin','publisher'].includes(role))throw Error('沒有編輯權限');
 return {user,role};
}
export async function storeImage(source,section,user){
 if(!source?.startsWith('data:'))return source||'';
 const match=/^data:(image\/(?:jpeg|png|webp));base64,([a-zA-Z0-9+/=]+)$/.exec(source);
 if(!match)throw Error('圖片格式須為 JPEG、PNG 或 WebP');
 const raw=atob(match[2]);
 if(raw.length>5*1024*1024)throw Error('圖片不得超過 5MB');
 const bytes=Uint8Array.from(raw,ch=>ch.charCodeAt(0));
 const ext={'image/jpeg':'jpg','image/png':'png','image/webp':'webp'}[match[1]];
 const path=user.id+'/'+section+'/'+crypto.randomUUID()+'.'+ext;
 const {error}=await db.storage.from('cms-media').upload(path,new Blob([bytes],{type:match[1]}),{contentType:match[1]});
 if(error)throw Error('圖片上傳失敗：'+error.message);
 return db.storage.from('cms-media').getPublicUrl(path).data.publicUrl;
}
export async function cloudWrite(k,item){
 if(!sections[k])throw Error('不支援的分類');
 const {user}=await requireEditor();
 const image=await storeImage(item.image,k,user);
 const {id,published,...data}=item;
 const row={section:sections[k],slug:k+'-'+String(id).replace(/[^a-zA-Z0-9_-]/g,''),title:item.title||'',sort_order:Number(item.order)||0,status:published?'published':'draft',data:{...data,image,legacy_id:id}};
 await saveContent(row);
 return {...item,image};
}
export async function cloudDelete(k,item){
 const {role}=await requireEditor();
 if(role!=='admin')throw Error('只有管理員可刪除');
 const {error}=await db.from('cms_content').delete().eq('section',sections[k]).eq('slug',k+'-'+String(item.id));
 if(error)throw error;
}
export async function cloudRead(k){
 await requireEditor();
 const rows=await getEditorial(sections[k]);
 return rows.map(r=>({...r.data,id:r.data?.legacy_id||r.slug,title:r.title,published:r.status==='published',order:r.sort_order}));
}
