// Public CMS content bridge. Reads only published rows through Supabase RLS.
// No secret keys and no arbitrary HTML execution.
import { getPublished } from './supabase-client.js';
export const publicSections = ['banner','brand_story','news','menu','store','recruitment','contact'];
export async function loadPublicContent() {
  const entries = await Promise.all(publicSections.map(async section => {
    try { return [section,{rows:await getPublished(section),error:null}]; }
    catch(error) { return [section,{rows:[],error:error.message}]; }
  }));
  return Object.fromEntries(entries);
}
export function safeImageUrl(value) {
  if (typeof value !== 'string') return '';
  try { const url=new URL(value,location.href); return url.protocol==='https:' ? url.href : ''; }
  catch { return ''; }
}
export function emitPublicContent(data) {
  window.dispatchEvent(new CustomEvent('timhowan:cms-content',{detail:data}));
}
