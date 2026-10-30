# 驗證紀錄

驗證日期：2026-10-30（台北時間）。

## 本機通過

- Chromium 真實瀏覽器觸控測試：`node tests/mobile.cjs`，五組尺寸、196 項檢查通過。
- 尺寸：375×667、390×844、430×932、844×390（橫向）、1440×900。
- 漢堡選單展開／關閉、點選錨點後收合、點擊外側關閉、Escape 關閉。
- 頁面無水平溢出，消息／菜單／門市卡片均有內容。
- 所有前台內嵌圖片及五張 Banner 解碼成功；原始圖片引用逐項比對相同。
- Banner 與品牌特色輪播、新聞分頁與文章 Popup。
- 菜單 Popup、三個分類、餐點詳情與返回；關閉後解除捲動鎖定並還原捲動位置。
- 南部門市篩選、門市 Popup 及 HTTPS 地圖連結。
- 聯絡表單必填、電話格式、選填電話留空、有效資料驗證，以及「留言並未送出」提示。
- 隱私權 Popup 開關；操作過程無 JavaScript 例外。
- CMS Demo 載入及初始化通過，無 JavaScript 例外。
- 手機選單及菜單 Popup 截圖已目視檢查。
- JavaScript 語法檢查通過。

測試另發現原始電話 `pattern` 的括號未跳脫，現代瀏覽器會忽略此規則；已修正並驗證無效電話會被拒絕。

## 尚未完成

- WebKit：引擎下載被環境網路政策拒絕，未執行；不可將 Chromium 觸控模擬描述為 Safari 已通過。
- iPhone Safari 實機：此環境沒有實機，需在部署完成後用 iPhone 確認直向／橫向、選單、Popup 捲動、表單輸入及返回操作。
- GitHub Pages 設定、Actions 部署結果及公開 HTTPS 回應：目前 GitHub API／Pages 網域被環境政策拒絕，待設定生效後驗證。

已將 `api.github.com`、`flowerphoebeliao-mkt.github.io`、`cdn.playwright.dev`、`playwright.download.prss.microsoft.com` 儲存至環境網路設定草稿；草稿尚需使用者在環境設定中儲存並發布，儲存草稿不等於已套用。

## 原始功能範圍

聯絡表單原本沒有寄信後端，CMS 原本只是 localStorage 示範，不會同步首頁。以上行為完整保留；本次不會對正式官網送出內容變更，也不會設定正式網域。
