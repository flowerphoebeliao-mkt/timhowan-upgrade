# Supabase 串接 — 第一階段基礎建置

目前狀態：**已建立雲端資料層與 RLS migration，尚未連接真實 Supabase 專案，亦未改動現有 index.html / cms.html。** 不應宣稱前後台已同步。

## 建立 Supabase 專案
1. 在 https://supabase.com/dashboard 建立專案，選擇適合台灣的區域。
2. SQL Editor 執行 `supabase/migrations/001_cms.sql`。
3. Authentication 建立管理員帳號（不要在公開頁面啟用任意註冊）。
4. 在 SQL Editor 依 migration 底部註解將該 auth user UUID 指派為 admin。
5. 以 `assets/supabase-config.example.js` 建立 `assets/supabase-config.js`，填入 Project URL 和 **publishable/anon** key。這些值不是秘密，但必須依賴 RLS；絕不可使用 service_role/secret key。
6. 先以 SQL Editor / 管理員測試草稿不公開、發布後匿名可讀、viewer 無法寫入。

## 下一步串接
- 逐項映射舊 CMS localStorage 欄位到 cms_content.data；原始欄位不能直接假設一致。
- 前台以 getPublished() 讀取發布內容；雲端未設定或讀取失敗時保留原有靜態資料，不破壞版型。
- 後台登入使用 Supabase Auth；以 cms_members 角色與資料庫 RLS 為準，不再依靠前端角色切換。
- 儲存、預覽、發布、下架要經過實際權限與跨裝置測試。
- 圖片 Storage bucket、MIME/大小限制與安全上傳策略待下一階段設計。
- CMS 包含站台設定／追蹤碼，需另行審查 XSS 與權限，不可直接將任意 HTML 腳本從資料庫渲染到公開前台。

## 上線邊界
- GitHub Pages 只能部署靜態頁面；資料庫、登入和持久化由 Supabase 提供。
- 在未完成安全驗證前，請勿用真實顧客資料測試。
- 不要把資料庫密碼、service_role key、JWT secret 寫入 GitHub 或對話。

## 2026-10-30 進度：已設定 timhowan-cms2 公開金鑰

- `assets/supabase-config.js` 已填入使用者提供的 Project URL 和 publishable key，無 secret/service_role key。
- `cloud-cms.html` + `assets/cloud-cms.js` 是獨立的 Supabase Auth / RLS 內容測試後台，提供草稿、發布、下架和 JSON 編輯；原有 `cms.html` 完全保留，不代表原版 CMS 已完成雲端遷移。
- GitHub Pages 工作流程已納入 cloud-cms.html，**必須合併 PR 並完成部署才會有測試網址**：`/timhowan-upgrade/cloud-cms.html`。
- `index.html` 尚未讀取 Supabase；雲端發布不會即時更新現有前台。
- 請先確認新專案的 `cms_members` / `cms_content` 和 admin RLS 都存在；使用者已在 SQL Editor 截圖顯示 admin。
- 未經真實瀏覽器與線上 Supabase 實測；切勿將本階段當成正式上線驗收。
