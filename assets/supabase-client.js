// Shared browser data layer. No credentials or service_role key in source.
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from './supabase-config.js';

if (!/^https:\/\//.test(SUPABASE_URL) || !SUPABASE_ANON_KEY) {
  throw new Error('Supabase 尚未設定：請建立 assets/supabase-config.js');
}
export const db = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false }
});
const allowed = new Set(['banner','brand_story','news','menu','store','recruitment','contact']);
export async function getPublished(section) {
  if (!allowed.has(section)) throw new Error('不支援的內容分類');
  const { data, error } = await db.from('cms_content')
    .select('id,section,slug,title,data,sort_order,published_at')
    .eq('section',section).eq('status','published')
    .order('sort_order',{ascending:true});
  if (error) throw error;
  return data;
}
export async function signIn(email,password) {
  const { data,error } = await db.auth.signInWithPassword({email,password});
  if (error) throw error;
  return data;
}
export async function signOut() {
  const {error}=await db.auth.signOut(); if(error) throw error;
}
export async function getMyRole() {
  const {data:{user},error:authError}=await db.auth.getUser();
  if(authError) throw authError;
  if(!user) return null;
  const {data,error}=await db.from('cms_members').select('role').eq('user_id',user.id).single();
  if(error) throw error;
  return data.role;
}
export async function getEditorial(section) {
  const {data,error}=await db.from('cms_content').select('*')
    .eq('section',section).order('sort_order',{ascending:true});
  if(error) throw error;
  return data;
}
export async function saveContent(item) {
  const {data:{user},error:authError}=await db.auth.getUser();
  if(authError || !user) throw authError || new Error('請先登入');
  const row={...item,updated_by:user.id};
  if(!row.id) row.created_by=user.id;
  const {data,error}=await db.from('cms_content').upsert(row,{onConflict:'section,slug'}).select().single();
  if(error) throw error;
  return data;
}
